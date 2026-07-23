"""Testes do módulo de IA (RF015): RBAC, validação, degradação sem chave e
a lógica de integração com a API do Gemini (mockada — a chamada real ao modelo
exige uma GEMINI_API_KEY que não é usada nos testes)."""
import json

import pytest

from app.services import ia_service


# ---------------------------------------------------------------------------
# Mock da chamada HTTP ao Gemini (seam único: ia_service._requisitar).
# Guarda o último payload enviado e devolve uma resposta no formato do Gemini.
# ---------------------------------------------------------------------------
class _FakeGemini:
    ultimo_caminho: str | None = None
    ultimo_payload: dict | None = None


def _resposta_gemini(texto: str) -> dict:
    return {"candidates": [{"content": {"parts": [{"text": texto}]}}]}


@pytest.fixture
def mock_ia(monkeypatch):
    """Substitui _requisitar por um falso que devolve o texto informado."""

    def _instalar(texto: str):
        _FakeGemini.ultimo_caminho = None
        _FakeGemini.ultimo_payload = None

        def _fake(caminho, payload):
            _FakeGemini.ultimo_caminho = caminho
            _FakeGemini.ultimo_payload = payload
            return _resposta_gemini(texto)

        monkeypatch.setattr(ia_service, "_requisitar", _fake)

    return _instalar


def _conteudo_usuario() -> str:
    return _FakeGemini.ultimo_payload["contents"][0]["parts"][0]["text"]


def _generation_config() -> dict:
    return _FakeGemini.ultimo_payload["generationConfig"]


# ---------------------------------------------------------------------------
# RBAC
# ---------------------------------------------------------------------------
def test_ia_exige_permissao(client, criar_usuario):
    headers, _ = criar_usuario("sem_ia", ["dashboard:read"])
    assert client.post("/api/v1/ia/resumir", headers=headers, json={"texto": "x" * 30}).status_code == 403
    assert (
        client.post("/api/v1/ia/estrutura-laudo", headers=headers, json={"contexto": "x" * 30}).status_code
        == 403
    )


# ---------------------------------------------------------------------------
# Validação
# ---------------------------------------------------------------------------
def test_resumir_texto_curto_retorna_422(client, headers_admin):
    assert client.post("/api/v1/ia/resumir", headers=headers_admin, json={"texto": "curto"}).status_code == 422


def test_estrutura_sem_processo_e_sem_contexto_retorna_422(client, headers_admin):
    assert client.post("/api/v1/ia/estrutura-laudo", headers=headers_admin, json={}).status_code == 422


# ---------------------------------------------------------------------------
# Degradação sem chave configurada (GEMINI_API_KEY vazio nos testes)
# ---------------------------------------------------------------------------
def test_sem_chave_retorna_503_com_mensagem(client, headers_admin):
    resp = client.post("/api/v1/ia/resumir", headers=headers_admin, json={"texto": "Texto suficiente para resumir." * 3})
    assert resp.status_code == 503
    assert "não configurada" in resp.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Lógica de integração (chamada HTTP mockada)
# ---------------------------------------------------------------------------
def test_resumir_extrai_texto_da_resposta(client, headers_admin, mock_ia):
    mock_ia("Resumo objetivo do documento.")
    resp = client.post("/api/v1/ia/resumir", headers=headers_admin, json={"texto": "Documento longo " * 5})
    assert resp.status_code == 200
    assert resp.json()["resumo"] == "Resumo objetivo do documento."
    # resumo é recurso simples: desliga o "pensamento" (thinkingBudget=0)
    assert _generation_config()["thinkingConfig"] == {"thinkingBudget": 0}


def test_estrutura_por_processo_monta_contexto_e_usa_pensamento(client, headers_admin, mock_ia, processo_id):
    mock_ia("1. Introdução\n2. Conclusão")
    resp = client.post("/api/v1/ia/estrutura-laudo", headers=headers_admin, json={"processo_id": processo_id})
    assert resp.status_code == 200
    assert "1. Introdução" in resp.json()["estrutura"]

    # estrutura usa pensamento (não envia thinkingBudget=0)
    assert "thinkingConfig" not in _generation_config()
    # o contexto enviado ao modelo é montado a partir do processo
    conteudo = _conteudo_usuario()
    assert "Número do processo" in conteudo and "0001234" in conteudo


def test_estrutura_por_contexto_livre(client, headers_admin, mock_ia):
    mock_ia("1. Seção A")
    resp = client.post(
        "/api/v1/ia/estrutura-laudo",
        headers=headers_admin,
        json={"contexto": "Perícia de engenharia sobre vícios construtivos."},
    )
    assert resp.status_code == 200
    assert resp.json()["estrutura"] == "1. Seção A"


# ---------------------------------------------------------------------------
# Extração de informações
# ---------------------------------------------------------------------------
def test_extrair_exige_permissao(client, criar_usuario):
    headers, _ = criar_usuario("sem_ia_extrair", ["dashboard:read"])
    assert client.post("/api/v1/ia/extrair", headers=headers, json={"texto": "x" * 30}).status_code == 403


def test_extrair_texto_curto_retorna_422(client, headers_admin):
    assert client.post("/api/v1/ia/extrair", headers=headers_admin, json={"texto": "curto"}).status_code == 422


def test_extrair_devolve_json_estruturado_e_usa_response_schema(client, headers_admin, mock_ia):
    payload = {
        "partes": ["Autor: Fulano", "Réu: Beltrano"],
        "valores": ["R$ 10.000,00"],
        "datas": ["01/02/2026"],
        "documentos": ["123.456.789-00"],
        "quesitos": ["O imóvel apresenta vícios?"],
        "objeto": "Vícios construtivos",
    }
    mock_ia(json.dumps(payload))
    resp = client.post(
        "/api/v1/ia/extrair",
        headers=headers_admin,
        json={"texto": "Petição inicial com partes, valores e quesitos." * 3},
    )
    assert resp.status_code == 200, resp.text
    corpo = resp.json()
    assert corpo["partes"] == ["Autor: Fulano", "Réu: Beltrano"]
    assert corpo["objeto"] == "Vícios construtivos"
    # extração pede saída estruturada (JSON) ao modelo
    gc = _generation_config()
    assert gc["responseMimeType"] == "application/json"
    assert gc["responseSchema"]["type"] == "OBJECT"


def test_extrair_json_invalido_retorna_502(client, headers_admin, mock_ia):
    mock_ia("isto não é json")
    resp = client.post(
        "/api/v1/ia/extrair", headers=headers_admin, json={"texto": "Texto qualquer para extrair." * 2}
    )
    assert resp.status_code == 502


# ---------------------------------------------------------------------------
# Checklist automático
# ---------------------------------------------------------------------------
def test_checklist_sem_processo_e_sem_contexto_retorna_422(client, headers_admin):
    assert client.post("/api/v1/ia/checklist", headers=headers_admin, json={}).status_code == 422


def test_checklist_por_processo_devolve_itens(client, headers_admin, mock_ia, processo_id):
    mock_ia(json.dumps({"itens": ["Conferir matrícula", "Registrar fotos"]}))
    resp = client.post("/api/v1/ia/checklist", headers=headers_admin, json={"processo_id": processo_id})
    assert resp.status_code == 200, resp.text
    assert resp.json()["itens"] == ["Conferir matrícula", "Registrar fotos"]
    assert "Número do processo" in _conteudo_usuario()


# ---------------------------------------------------------------------------
# Organização de evidências
# ---------------------------------------------------------------------------
def test_organizar_evidencias_monta_contexto(client, headers_admin, mock_ia, processo_id):
    mock_ia("Linha do tempo sugerida.")
    resp = client.post(
        "/api/v1/ia/organizar-evidencias", headers=headers_admin, json={"processo_id": processo_id}
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["organizacao"] == "Linha do tempo sugerida."
    # sem evidências cadastradas, o contexto sinaliza isso explicitamente
    assert "nenhuma evidência cadastrada" in _conteudo_usuario()


# ---------------------------------------------------------------------------
# Busca inteligente
# ---------------------------------------------------------------------------
def test_busca_inteligente_valida_consulta_curta(client, headers_admin, processo_id):
    resp = client.post(
        "/api/v1/ia/busca-inteligente", headers=headers_admin, json={"processo_id": processo_id, "consulta": "oi"}
    )
    assert resp.status_code == 422


def test_busca_inteligente_monta_acervo_e_pergunta(client, headers_admin, mock_ia, processo_id):
    mock_ia("Nada no acervo responde a isso.")
    resp = client.post(
        "/api/v1/ia/busca-inteligente",
        headers=headers_admin,
        json={"processo_id": processo_id, "consulta": "Existe laudo finalizado?"},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["resposta"] == "Nada no acervo responde a isso."
    conteudo = _conteudo_usuario()
    assert "Pergunta do perito: Existe laudo finalizado?" in conteudo
    assert "Documentos:" in conteudo and "Evidências:" in conteudo and "Laudos:" in conteudo
