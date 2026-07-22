"""Testes do módulo CRM: clientes, escritórios e advogados (com FK e bloqueio 409)."""


def test_cliente_crud_completo(client, headers_admin):
    # Criar
    resp = client.post(
        "/api/v1/clientes",
        headers=headers_admin,
        json={"nome": "Construtora Alfa", "tipo": "pessoa_juridica", "documento": "12.345.678/0001-90"},
    )
    assert resp.status_code == 201, resp.text
    cliente = resp.json()
    assert cliente["tipo"] == "pessoa_juridica"
    cid = cliente["id"]

    # Listar
    resp = client.get("/api/v1/clientes", headers=headers_admin)
    assert resp.status_code == 200
    assert any(c["id"] == cid for c in resp.json())

    # Editar
    resp = client.patch(f"/api/v1/clientes/{cid}", headers=headers_admin, json={"telefone": "(11) 3333-4444"})
    assert resp.status_code == 200
    assert resp.json()["telefone"] == "(11) 3333-4444"

    # Remover
    assert client.delete(f"/api/v1/clientes/{cid}", headers=headers_admin).status_code == 204
    assert not any(c["id"] == cid for c in client.get("/api/v1/clientes", headers=headers_admin).json())


def test_advogado_vem_com_escritorio_aninhado(client, headers_admin):
    esc = client.post(
        "/api/v1/escritorios", headers=headers_admin, json={"nome": "Silva & Associados", "uf": "PR"}
    ).json()
    resp = client.post(
        "/api/v1/advogados",
        headers=headers_admin,
        json={"nome": "Dra. Fulana", "oab": "PR123456", "escritorio_id": esc["id"]},
    )
    assert resp.status_code == 201, resp.text
    adv = resp.json()
    assert adv["escritorio"] is not None
    assert adv["escritorio"]["id"] == esc["id"]


def test_remover_escritorio_com_advogado_vinculado_bloqueia_409(client, headers_admin):
    esc = client.post("/api/v1/escritorios", headers=headers_admin, json={"nome": "Escritório X"}).json()
    client.post(
        "/api/v1/advogados",
        headers=headers_admin,
        json={"nome": "Advogado Vinculado", "escritorio_id": esc["id"]},
    )
    resp = client.delete(f"/api/v1/escritorios/{esc['id']}", headers=headers_admin)
    assert resp.status_code == 409
    assert "advogados vinculados" in resp.json()["detail"]


def test_desvincular_advogado_permite_remover_escritorio(client, headers_admin):
    esc = client.post("/api/v1/escritorios", headers=headers_admin, json={"nome": "Escritório Y"}).json()
    adv = client.post(
        "/api/v1/advogados", headers=headers_admin, json={"nome": "Adv", "escritorio_id": esc["id"]}
    ).json()
    # Desvincula (escritorio_id = null) e então consegue remover o escritório.
    client.patch(f"/api/v1/advogados/{adv['id']}", headers=headers_admin, json={"escritorio_id": None})
    assert client.delete(f"/api/v1/escritorios/{esc['id']}", headers=headers_admin).status_code == 204


def test_email_invalido_em_contato_retorna_422(client, headers_admin):
    resp = client.post(
        "/api/v1/contatos", headers=headers_admin, json={"nome": "Erro", "email": "nao-eh-email"}
    )
    assert resp.status_code == 422


def test_assistente_le_mas_nao_escreve_no_crm(client, criar_usuario):
    headers, _ = criar_usuario("assistente_crm", ["crm:read"])
    assert client.get("/api/v1/advogados", headers=headers).status_code == 200
    assert client.post("/api/v1/advogados", headers=headers, json={"nome": "Bloqueado"}).status_code == 403
