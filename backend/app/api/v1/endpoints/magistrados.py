from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_permission
from app.models.usuario import Usuario
from app.schemas.magistrado import MagistradoCreate, MagistradoOut, MagistradoUpdate
from app.services import magistrado_service

router = APIRouter(prefix="/magistrados", tags=["crm"])


@router.get("", response_model=list[MagistradoOut])
def listar_magistrados(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("crm:read")),
):
    return magistrado_service.listar(db)


@router.post("", response_model=MagistradoOut, status_code=201)
def criar_magistrado(
    dados: MagistradoCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("crm:write")),
):
    return magistrado_service.criar(db, dados)


@router.patch("/{magistrado_id}", response_model=MagistradoOut)
def atualizar_magistrado(
    magistrado_id: int,
    dados: MagistradoUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("crm:write")),
):
    return magistrado_service.atualizar(db, magistrado_id, dados)


@router.delete("/{magistrado_id}", status_code=204)
def remover_magistrado(
    magistrado_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("crm:write")),
):
    magistrado_service.remover(db, magistrado_id)
