"""Configuração e fixtures compartilhadas dos testes automatizados do backend.

Estratégia de isolamento: os testes rodam contra um **schema dedicado**
(`perito_os_test`) dentro do banco Postgres real, apontado via `search_path` na
própria `DATABASE_URL`. Isso mantém os testes fiéis à produção (mesmo Postgres,
mesmos tipos) sem tocar nos dados de desenvolvimento do schema `public`, e sem
exigir permissão de superusuário (a role só precisa ser dona do banco).

As variáveis de ambiente são definidas ANTES de qualquer import de `app.*`,
porque `app.core.config.settings` e `app.core.database.engine` são criados no
momento do import.
"""
import os

# Base do banco de teste (em CI, passe TEST_DATABASE_URL apontando para o Postgres do runner).
_BASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+psycopg2://perito_os:perito_os@localhost:5432/perito_os",
)
SCHEMA_TESTE = "perito_os_test"

# search_path via opção libpq, para que TODAS as conexões (engine do app, SessionLocal,
# middleware de auditoria) resolvam as tabelas no schema de teste.
#
# IMPORTANTE: o search_path aponta EXCLUSIVAMENTE para o schema de teste, SEM o
# fallback `public`. Se `public` estivesse na lista, o `create_all(checkfirst=True)`
# enxergaria as tabelas reais do schema `public` e não as recriaria no schema de
# teste — e aí todas as operações (inclusive o TRUNCATE de limpeza e o drop_all de
# teardown) cairiam sobre os dados reais de desenvolvimento. (funções de sistema como
# `now()` continuam resolvendo por `pg_catalog`, que é sempre implícito.)
os.environ["DATABASE_URL"] = f"{_BASE_URL}?options=-csearch_path%3D{SCHEMA_TESTE}"
# Redis propositalmente inacessível: o rate limiter cai para memória do processo,
# que conseguimos limpar entre os testes (evita acoplamento entre testes de login).
os.environ["REDIS_URL"] = "redis://localhost:6399/0"
os.environ["SECRET_KEY"] = "chave-de-teste"
# IA propositalmente sem chave: os testes de degradação (503) e os testes com a
# chamada ao Gemini mockada não dependem de uma chave real. Forçar vazio aqui
# mantém a suíte determinística, independentemente do backend/.env do dev.
os.environ["GEMINI_API_KEY"] = ""

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import text  # noqa: E402

from app.core import rate_limiter  # noqa: E402
from app.core.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app import models  # noqa: E402  — garante que todos os modelos sejam registrados no metadata
from app.seed import ADMIN_EMAIL, ADMIN_SENHA_INICIAL, PERFIS_PADRAO, run as rodar_seed  # noqa: E402

# Tabelas que guardam o baseline (perfis padrão + admin) e não são zeradas entre testes.
_TABELAS_BASELINE = {"perfis", "usuarios"}
_NOMES_PERFIS_PADRAO = {p["nome"] for p in PERFIS_PADRAO}


@pytest.fixture(scope="session", autouse=True)
def _preparar_schema():
    """Cria o schema de teste + tabelas + baseline uma vez por sessão; derruba ao final."""
    with engine.connect() as conn:
        conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {SCHEMA_TESTE}"))
        conn.commit()

    Base.metadata.create_all(bind=engine)

    # Trava de segurança: garante que as tabelas foram criadas NO schema de teste e
    # que nenhuma operação vai cair sobre o schema `public` (dados reais). Se por
    # qualquer motivo uma tabela resolver para `public`, aborta a suíte inteira.
    with engine.connect() as conn:
        schema_resolvido = conn.execute(
            text("SELECT nspname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace "
                 "WHERE c.oid = 'usuarios'::regclass")
        ).scalar()
    if schema_resolvido != SCHEMA_TESTE:
        Base.metadata.drop_all(bind=engine)
        raise RuntimeError(
            f"ABORTADO: as tabelas de teste resolveram para o schema '{schema_resolvido}', "
            f"e não '{SCHEMA_TESTE}'. Isso colocaria os dados reais em risco. Verifique o search_path."
        )

    rodar_seed()  # cria perfis padrão + usuário admin

    yield

    Base.metadata.drop_all(bind=engine)
    with engine.connect() as conn:
        conn.execute(text(f"DROP SCHEMA IF EXISTS {SCHEMA_TESTE} CASCADE"))
        conn.commit()


@pytest.fixture(autouse=True)
def _limpar_dados():
    """Restaura o baseline antes de cada teste: zera as tabelas de dados e remove
    usuários/perfis criados pelos testes, mantendo os perfis padrão e o admin."""
    tabelas_dados = [
        t.name for t in reversed(Base.metadata.sorted_tables) if t.name not in _TABELAS_BASELINE
    ]
    with engine.connect() as conn:
        if tabelas_dados:
            lista = ", ".join(tabelas_dados)
            conn.execute(text(f"TRUNCATE {lista} RESTART IDENTITY CASCADE"))
        conn.execute(text("DELETE FROM usuarios WHERE email <> :email"), {"email": ADMIN_EMAIL})
        conn.execute(
            text("DELETE FROM perfis WHERE nome <> ALL(:nomes)"),
            {"nomes": list(_NOMES_PERFIS_PADRAO)},
        )
        conn.commit()

    rate_limiter._memoria.clear()
    yield


@pytest.fixture
def db():
    """Sessão do SQLAlchemy para os testes montarem/inspecionarem dados diretamente."""
    sessao = SessionLocal()
    try:
        yield sessao
    finally:
        sessao.close()


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


# ---------------------------------------------------------------------------
# Helpers de autenticação
# ---------------------------------------------------------------------------

def _login(client: TestClient, email: str, senha: str) -> str:
    resp = client.post("/api/v1/auth/login", data={"username": email, "password": senha})
    assert resp.status_code == 200, f"login falhou: {resp.status_code} {resp.text}"
    return resp.json()["access_token"]


def _headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def token_admin(client) -> str:
    return _login(client, ADMIN_EMAIL, ADMIN_SENHA_INICIAL)


@pytest.fixture
def headers_admin(token_admin) -> dict:
    return _headers(token_admin)


@pytest.fixture
def comarca_id(client, headers_admin) -> int:
    resp = client.post(
        "/api/v1/comarcas",
        headers=headers_admin,
        json={"nome": "Comarca de Teste", "uf": "SP", "tribunal": "TJSP"},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


@pytest.fixture
def processo_id(client, headers_admin, comarca_id) -> int:
    resp = client.post(
        "/api/v1/processos",
        headers=headers_admin,
        json={"numero": "0001234-00.2026.8.26.0100", "comarca_id": comarca_id},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


@pytest.fixture
def criar_usuario(client, db, headers_admin):
    """Fábrica de usuário com um perfil de permissões específico. Retorna (headers, usuario_id).

    Cria o perfil direto no banco (não há endpoint de perfis de escrita) e o usuário
    via API, e devolve os headers já autenticados desse usuário.
    """
    from app.models.perfil import Perfil

    def _criar(nome_perfil: str, permissoes: list[str], senha: str = "Senha@12345") -> tuple[dict, int]:
        perfil = Perfil(nome=nome_perfil, descricao="perfil de teste", permissoes=permissoes)
        db.add(perfil)
        db.commit()
        db.refresh(perfil)

        email = f"{nome_perfil}@teste.com.br"
        resp = client.post(
            "/api/v1/usuarios",
            headers=headers_admin,
            json={"nome": f"Usuário {nome_perfil}", "email": email, "senha": senha, "perfil_id": perfil.id},
        )
        assert resp.status_code == 201, resp.text
        usuario_id = resp.json()["id"]
        token = _login(client, email, senha)
        return _headers(token), usuario_id

    return _criar
