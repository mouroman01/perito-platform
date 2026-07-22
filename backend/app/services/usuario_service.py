from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import rate_limiter
from app.core.security import hash_password, verify_password
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate


def obter_por_email(db: Session, email: str) -> Usuario | None:
    return db.scalar(select(Usuario).where(Usuario.email == email))


def autenticar(db: Session, email: str, senha: str) -> Usuario:
    chave_limite = f"login_falhas:{email.strip().lower()}"

    if rate_limiter.contar_falhas(chave_limite) >= rate_limiter.LIMITE_TENTATIVAS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Muitas tentativas de login. Tente novamente em alguns minutos.",
        )

    erro = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="E-mail ou senha inválidos",
    )
    usuario = obter_por_email(db, email)
    if usuario is None or not verify_password(senha, usuario.senha_hash):
        rate_limiter.registrar_falha(chave_limite)
        raise erro
    if not usuario.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo",
        )

    rate_limiter.limpar(chave_limite)
    usuario.ultimo_login_em = datetime.now(timezone.utc)
    db.commit()
    db.refresh(usuario)
    return usuario


def listar(db: Session) -> list[Usuario]:
    return list(db.scalars(select(Usuario).order_by(Usuario.nome)))


def criar(db: Session, dados: UsuarioCreate) -> Usuario:
    if obter_por_email(db, dados.email) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe um usuário com este e-mail",
        )
    usuario = Usuario(
        nome=dados.nome,
        email=dados.email,
        senha_hash=hash_password(dados.senha),
        perfil_id=dados.perfil_id,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


def obter_ou_404(db: Session, usuario_id: int) -> Usuario:
    usuario = db.get(Usuario, usuario_id)
    if usuario is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
    return usuario


def atualizar(db: Session, usuario_id: int, dados: UsuarioUpdate) -> Usuario:
    usuario = obter_ou_404(db, usuario_id)
    if dados.nome is not None:
        usuario.nome = dados.nome
    if dados.perfil_id is not None:
        usuario.perfil_id = dados.perfil_id
    if dados.ativo is not None:
        usuario.ativo = dados.ativo
    if dados.senha is not None:
        usuario.senha_hash = hash_password(dados.senha)
    db.commit()
    db.refresh(usuario)
    return usuario


def inativar(db: Session, usuario_id: int) -> Usuario:
    usuario = obter_ou_404(db, usuario_id)
    usuario.ativo = False
    db.commit()
    db.refresh(usuario)
    return usuario
