from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_permission
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioOut, UsuarioUpdate
from app.services import usuario_service

router = APIRouter(prefix="/usuarios", tags=["usuários"])


@router.get("", response_model=list[UsuarioOut])
def listar_usuarios(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("usuarios:read")),
):
    return usuario_service.listar(db)


@router.post("", response_model=UsuarioOut, status_code=201)
def criar_usuario(
    dados: UsuarioCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("usuarios:write")),
):
    return usuario_service.criar(db, dados)


@router.patch("/{usuario_id}", response_model=UsuarioOut)
def atualizar_usuario(
    usuario_id: int,
    dados: UsuarioUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("usuarios:write")),
):
    return usuario_service.atualizar(db, usuario_id, dados)


@router.delete("/{usuario_id}", response_model=UsuarioOut)
def inativar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("usuarios:write")),
):
    return usuario_service.inativar(db, usuario_id)
