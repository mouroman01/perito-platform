from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_permission
from app.models.usuario import Usuario
from app.schemas.compromisso import CompromissoCreate, CompromissoOut, CompromissoUpdate
from app.services import compromisso_service

router = APIRouter(prefix="/agenda", tags=["agenda"])


@router.get("", response_model=list[CompromissoOut])
def listar_compromissos(
    processo_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("agenda:read")),
):
    return compromisso_service.listar(db, processo_id)


@router.post("", response_model=CompromissoOut, status_code=201)
def criar_compromisso(
    dados: CompromissoCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("agenda:write")),
):
    return compromisso_service.criar(db, dados)


@router.patch("/{compromisso_id}", response_model=CompromissoOut)
def atualizar_compromisso(
    compromisso_id: int,
    dados: CompromissoUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("agenda:write")),
):
    return compromisso_service.atualizar(db, compromisso_id, dados)


@router.delete("/{compromisso_id}", status_code=204)
def remover_compromisso(
    compromisso_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("agenda:write")),
):
    compromisso_service.remover(db, compromisso_id)
