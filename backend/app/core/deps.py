from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt import ExpiredSignatureError, InvalidTokenError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models.usuario import Usuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessão expirada",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except InvalidTokenError:
        raise credentials_error

    if payload.get("type") != "access":
        raise credentials_error

    usuario_id = payload.get("sub")
    if usuario_id is None:
        raise credentials_error

    usuario = db.get(Usuario, int(usuario_id))
    if usuario is None or not usuario.ativo:
        raise credentials_error

    # Guardado na própria Session (não em ContextVar) porque dependencies e o
    # handler do endpoint podem rodar em threads distintas do threadpool do
    # FastAPI; a instância de Session, porém, é a mesma ao longo da requisição.
    db.info["usuario_id"] = usuario.id
    return usuario


def require_permission(permissao: str):
    def dependency(usuario: Usuario = Depends(get_current_user)) -> Usuario:
        permissoes = usuario.perfil.permissoes or []
        if "*" in permissoes or permissao in permissoes:
            return usuario
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário sem permissão para esta ação",
        )

    return dependency
