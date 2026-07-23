"""Testes do módulo de IA (RF015): RBAC, validação, degradação sem chave e
a lógica de integração com o cliente Anthropic (mockado — a chamada real ao
modelo exige uma ANTHROPIC_API_KEY que não é usada nos testes)."""
import pytest

from app.services import ia_service


# ---------------------------------------------------------------------------
# Cliente Anthropic falso, para testar a lógica sem chamar a API de verdade.
# ---------------------------------------------------------------------------
class _Bloco:
    def __init__(self, tipo: str, text: str = ""):
        self.type = tipo
        self.text = text


class _Resposta:
    def __init__(self, blocos):
        self.content = blocos


class _FakeMessages:
    def __init__(self, blocos):
        self._blocos = blocos

    def create(self, **kwargs):
        _FakeCliente.ultima_chamada = kwargs
        return _Resposta(self._blocos)


class _FakeCliente:
    ultima_chamada: dict | None = None

    def __init__(self, blocos):
        self.messages = _FakeMessages(blocos)


@pytest.fixture
def mock_ia(monkeypatch):
    """Substitui o cliente Anthropic por um falso que devolve blocos definidos."""

    def _instalar(blocos):
        _FakeCliente.ultima_chamada = None
        monkeypatch.setattr(ia_service, "_obter_cliente", lambda: _FakeCliente(blocos))

    return _instalar


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
# Degradação sem chave configurada (ANTHROPIC_API_KEY vazio nos testes)
# ---------------------------------------------------------------------------
def test_sem_chave_retorna_503_com_mensagem(client, headers_admin):
    resp = client.post("/api/v1/ia/resumir", headers=headers_admin, json={"texto": "Texto suficiente para resumir." * 3})
    assert resp.status_code == 503
    assert "não configurada" in resp.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Lógica de integração (cliente mockado)
# ---------------------------------------------------------------------------
def test_resumir_extrai_texto_da_resposta(client, headers_admin, mock_ia):
    mock_ia([_Bloco("text", "Resumo objetivo do documento.")])
    resp = client.post("/api/v1/ia/resumir", headers=headers_admin, json={"texto": "Documento longo " * 5})
    assert resp.status_code == 200
    assert resp.json()["resumo"] == "Resumo objetivo do documento."


def test_estrutura_por_processo_monta_contexto_e_usa_pensamento(client, headers_admin, mock_ia, processo_id):
    # Blocos de "thinking" (adaptativo) devem ser ignorados; só o texto entra na resposta.
    mock_ia([_Bloco("thinking", ""), _Bloco("text", "1. Introdução\n2. Conclusão")])
    resp = client.post("/api/v1/ia/estrutura-laudo", headers=headers_admin, json={"processo_id": processo_id})
    assert resp.status_code == 200
    assert "1. Introdução" in resp.json()["estrutura"]

    chamada = _FakeCliente.ultima_chamada
    assert chamada["thinking"] == {"type": "adaptive"}  # estrutura usa pensamento adaptativo
    # o contexto enviado ao modelo é montado a partir do processo
    conteudo = chamada["messages"][0]["content"]
    assert "Número do processo" in conteudo and "0001234" in conteudo


def test_estrutura_por_contexto_livre(client, headers_admin, mock_ia):
    mock_ia([_Bloco("text", "1. Seção A")])
    resp = client.post(
        "/api/v1/ia/estrutura-laudo",
        headers=headers_admin,
        json={"contexto": "Perícia de engenharia sobre vícios construtivos."},
    )
    assert resp.status_code == 200
    assert resp.json()["estrutura"] == "1. Seção A"
