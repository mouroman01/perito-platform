"""Popula perfis padrão e o usuário administrador inicial.

Uso: python -m app.seed
"""
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.perfil import Perfil
from app.models.usuario import Usuario

PERFIS_PADRAO = [
    {
        "nome": "admin",
        "descricao": "Administrador do sistema",
        "permissoes": ["*"],
    },
    {
        "nome": "perito",
        "descricao": "Perito judicial",
        "permissoes": [
            "dashboard:read",
            "usuarios:read",
            "crm:read",
            "crm:write",
            "processos:read",
            "processos:write",
            "agenda:read",
            "agenda:write",
            "financeiro:read",
            "financeiro:write",
            "biblioteca:read",
            "biblioteca:write",
            "laudos:read",
            "laudos:write",
            "relatorios:read",
            "ia:usar",
        ],
    },
    {
        "nome": "assistente_tecnico",
        "descricao": "Assistente técnico",
        "permissoes": [
            "dashboard:read",
            "crm:read",
            "processos:read",
            "agenda:read",
            "biblioteca:read",
            "laudos:read",
        ],
    },
]

ADMIN_EMAIL = "admin@peritoos.com.br"
ADMIN_SENHA_INICIAL = "TrocarSenha@123"


def run() -> None:
    db = SessionLocal()
    try:
        perfis_por_nome = {}
        for dados in PERFIS_PADRAO:
            perfil = db.query(Perfil).filter_by(nome=dados["nome"]).one_or_none()
            if perfil is None:
                perfil = Perfil(**dados)
                db.add(perfil)
                db.flush()
            else:
                # Perfis padrão têm suas permissões e descrição ressincronizadas
                # a cada execução do seed, para acompanhar novas fases do roadmap.
                perfil.descricao = dados["descricao"]
                perfil.permissoes = dados["permissoes"]
            perfis_por_nome[dados["nome"]] = perfil

        admin = db.query(Usuario).filter_by(email=ADMIN_EMAIL).one_or_none()
        if admin is None:
            admin = Usuario(
                nome="Administrador",
                email=ADMIN_EMAIL,
                senha_hash=hash_password(ADMIN_SENHA_INICIAL),
                perfil_id=perfis_por_nome["admin"].id,
            )
            db.add(admin)
            print(f"Usuário admin criado: {ADMIN_EMAIL} / senha inicial: {ADMIN_SENHA_INICIAL}")
        else:
            print("Usuário admin já existe, nada a fazer.")

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    run()
