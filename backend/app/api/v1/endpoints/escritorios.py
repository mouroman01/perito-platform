from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_permission
from app.models.usuario import Usuario
from app.schemas.escritorio import EscritorioCreate, EscritorioOut, EscritorioUpdate
from app.services import escritorio_service

router = APIRouter(prefix="/escritorios", tags=["crm"])


@router.get("", response_model=list[EscritorioOut])
def listar_escritorios(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("crm:read")),
):
    return escritorio_service.listar(db)


@router.post("", response_model=EscritorioOut, status_code=201)
def criar_escritorio(
    dados: EscritorioCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("crm:write")),
):
    return escritorio_service.criar(db, dados)


@router.patch("/{escritorio_id}", response_model=EscritorioOut)
def atualizar_escritorio(
    escritorio_id: int,
    dados: EscritorioUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("crm:write")),
):
    return escritorio_service.atualizar(db, escritorio_id, dados)


@router.delete("/{escritorio_id}", status_code=204)
def remover_escritorio(
    escritorio_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("crm:write")),
):
    escritorio_service.remover(db, escritorio_id)
