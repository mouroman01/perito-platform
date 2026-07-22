from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_permission
from app.models.usuario import Usuario
from app.schemas.advogado import AdvogadoCreate, AdvogadoOut, AdvogadoUpdate
from app.services import advogado_service

router = APIRouter(prefix="/advogados", tags=["crm"])


@router.get("", response_model=list[AdvogadoOut])
def listar_advogados(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("crm:read")),
):
    return advogado_service.listar(db)


@router.post("", response_model=AdvogadoOut, status_code=201)
def criar_advogado(
    dados: AdvogadoCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("crm:write")),
):
    return advogado_service.criar(db, dados)


@router.patch("/{advogado_id}", response_model=AdvogadoOut)
def atualizar_advogado(
    advogado_id: int,
    dados: AdvogadoUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("crm:write")),
):
    return advogado_service.atualizar(db, advogado_id, dados)


@router.delete("/{advogado_id}", status_code=204)
def remover_advogado(
    advogado_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("crm:write")),
):
    advogado_service.remover(db, advogado_id)
