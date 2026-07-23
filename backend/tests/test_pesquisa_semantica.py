"""Testes da pesquisa semântica (RF015): reindexação, ranking por cosseno e RBAC.

Os embeddings do Gemini são mockados de forma determinística (mapeando palavras-
chave para eixos do vetor), para que a ordenação por cosseno seja previsível sem
chamar a API real.
"""
import pytest

from app.models.laudo import Laudo
from app.services import ia_service


def _fake_embedding(texto: str) -> list[float]:
    t = texto.lower()
    return [
        1.0 if ("infiltra" in t) else 0.0,   # eixo "infiltração"
        1.0 if ("prazo" in t or "honorár" in t) else 0.0,  # eixo "prazo/honorários"
        0.1,  # constante pequena para a norma nunca ser zero
    ]


@pytest.fixture
def mock_embedding(monkeypatch):
    monkeypatch.setattr(ia_service, "gerar_embedding", _fake_embedding)


@pytest.fixture
def laudos_indexaveis(db, processo_id):
    db.add(Laudo(titulo="Laudo A", conteudo="Análise de infiltração no telhado.", processo_id=processo_id))
    db.add(Laudo(titulo="Laudo B", conteudo="Discussão sobre prazo e honorários periciais.", processo_id=processo_id))
    db.commit()


def test_reindexar_e_buscar_ranqueia_por_similaridade(
    client, headers_admin, mock_embedding, laudos_indexaveis
):
    r = client.post("/api/v1/ia/pesquisa-semantica/reindexar", headers=headers_admin)
    assert r.status_code == 200, r.text
    assert r.json()["indexados"] == 2

    r = client.post(
        "/api/v1/ia/pesquisa-semantica",
        headers=headers_admin,
        json={"consulta": "problema de infiltração"},
    )
    assert r.status_code == 200, r.text
    resultados = r.json()["resultados"]
    assert len(resultados) == 2
    # o laudo sobre infiltração deve vir primeiro, com score maior que o outro
    assert resultados[0]["titulo"] == "Laudo A"
    assert resultados[0]["score"] > resultados[1]["score"]
    assert resultados[0]["url"].startswith("/laudos/")


def test_pesquisa_semantica_respeita_limite(client, headers_admin, mock_embedding, laudos_indexaveis):
    client.post("/api/v1/ia/pesquisa-semantica/reindexar", headers=headers_admin)
    r = client.post(
        "/api/v1/ia/pesquisa-semantica",
        headers=headers_admin,
        json={"consulta": "infiltração", "limite": 1},
    )
    assert r.status_code == 200
    assert len(r.json()["resultados"]) == 1


def test_pesquisa_semantica_rbac_filtra_por_tipo(
    client, headers_admin, criar_usuario, mock_embedding, laudos_indexaveis
):
    # admin indexa os laudos
    client.post("/api/v1/ia/pesquisa-semantica/reindexar", headers=headers_admin)

    # usuário com ia:usar mas SEM laudos:read/processos:read não vê resultado algum
    headers, _ = criar_usuario("ia_sem_leitura", ["ia:usar"])
    r = client.post(
        "/api/v1/ia/pesquisa-semantica",
        headers=headers,
        json={"consulta": "infiltração"},
    )
    assert r.status_code == 200
    assert r.json()["resultados"] == []


def test_pesquisa_semantica_exige_permissao(client, criar_usuario):
    headers, _ = criar_usuario("sem_ia_semantica", ["dashboard:read"])
    assert (
        client.post("/api/v1/ia/pesquisa-semantica", headers=headers, json={"consulta": "abc"}).status_code
        == 403
    )
    assert (
        client.post("/api/v1/ia/pesquisa-semantica/reindexar", headers=headers).status_code == 403
    )


def test_pesquisa_semantica_consulta_curta_retorna_422(client, headers_admin):
    assert (
        client.post("/api/v1/ia/pesquisa-semantica", headers=headers_admin, json={"consulta": "ab"}).status_code
        == 422
    )
