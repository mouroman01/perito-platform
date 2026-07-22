"""Testes de autenticação, sessão e controle de permissões (RBAC)."""
from app.seed import ADMIN_EMAIL, ADMIN_SENHA_INICIAL


def test_health_ok(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["banco_de_dados"] == "ok"


def test_login_sucesso_retorna_tokens_e_usuario(client):
    resp = client.post(
        "/api/v1/auth/login",
        data={"username": ADMIN_EMAIL, "password": ADMIN_SENHA_INICIAL},
    )
    assert resp.status_code == 200
    corpo = resp.json()
    assert corpo["access_token"]
    assert corpo["refresh_token"]
    assert corpo["usuario"]["email"] == ADMIN_EMAIL
    assert corpo["usuario"]["perfil"]["nome"] == "admin"


def test_login_senha_errada_retorna_401(client):
    resp = client.post(
        "/api/v1/auth/login",
        data={"username": ADMIN_EMAIL, "password": "senha-errada"},
    )
    assert resp.status_code == 401


def test_me_retorna_usuario_autenticado(client, headers_admin):
    resp = client.get("/api/v1/auth/me", headers=headers_admin)
    assert resp.status_code == 200
    assert resp.json()["email"] == ADMIN_EMAIL


def test_rota_protegida_sem_token_retorna_401(client):
    resp = client.get("/api/v1/usuarios")
    assert resp.status_code == 401


def test_esqueci_senha_tem_resposta_neutra(client):
    # E-mail inexistente não deve revelar que não existe (proteção contra enumeração).
    resp = client.post("/api/v1/auth/esqueci-senha", json={"email": "naoexiste@teste.com.br"})
    assert resp.status_code == 200
    assert "link" in resp.json()["detail"].lower()


def test_rbac_usuario_sem_permissao_recebe_403(client, criar_usuario):
    headers, _ = criar_usuario("somente_dashboard", ["dashboard:read"])
    # Tem dashboard:read, mas não crm:read.
    assert client.get("/api/v1/clientes", headers=headers).status_code == 403
    assert client.get("/api/v1/dashboard", headers=headers).status_code == 200


def test_rbac_admin_curinga_acessa_tudo(client, headers_admin):
    assert client.get("/api/v1/clientes", headers=headers_admin).status_code == 200
    assert client.get("/api/v1/usuarios", headers=headers_admin).status_code == 200
