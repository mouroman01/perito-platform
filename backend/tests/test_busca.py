"""Testes da busca global (RF014): cobertura entre entidades e filtragem por RBAC."""


def test_busca_encontra_processo_por_numero(client, headers_admin, processo_id):
    resp = client.get("/api/v1/busca", headers=headers_admin, params={"q": "0001234"})
    assert resp.status_code == 200
    tipos = {r["tipo"] for r in resp.json()}
    assert "processo" in tipos


def test_busca_encontra_cliente_por_nome(client, headers_admin):
    client.post(
        "/api/v1/clientes",
        headers=headers_admin,
        json={"nome": "Construtora Beta", "tipo": "pessoa_juridica"},
    )
    resp = client.get("/api/v1/busca", headers=headers_admin, params={"q": "Construtora Beta"})
    assert resp.status_code == 200
    assert any(r["tipo"] == "cliente" and r["titulo"] == "Construtora Beta" for r in resp.json())


def test_busca_termo_curto_retorna_422(client, headers_admin):
    assert client.get("/api/v1/busca", headers=headers_admin, params={"q": "a"}).status_code == 422


def test_busca_sem_correspondencia_retorna_lista_vazia(client, headers_admin):
    resp = client.get("/api/v1/busca", headers=headers_admin, params={"q": "zzz_inexistente_zzz"})
    assert resp.status_code == 200
    assert resp.json() == []


def test_busca_respeita_rbac(client, headers_admin, criar_usuario, processo_id):
    # Usuário só com crm:read não deve receber resultados de processo (processos:read).
    client.post(
        "/api/v1/clientes", headers=headers_admin, json={"nome": "Cliente Gama", "tipo": "pessoa_fisica"}
    )
    headers, _ = criar_usuario("busca_crm", ["crm:read"])

    r_proc = client.get("/api/v1/busca", headers=headers, params={"q": "0001234"})
    assert "processo" not in {r["tipo"] for r in r_proc.json()}

    r_cli = client.get("/api/v1/busca", headers=headers, params={"q": "Cliente Gama"})
    assert any(r["tipo"] == "cliente" for r in r_cli.json())
