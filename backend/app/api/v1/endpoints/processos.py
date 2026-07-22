from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_permission
from app.models.usuario import Usuario
from app.schemas.processo import ProcessoCreate, ProcessoOut, ProcessoUpdate
from app.services import processo_service

router = APIRouter(prefix="/processos", tags=["processos"])


@router.get("", response_model=list[ProcessoOut])
def listar_processos(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("processos:read")),
):
    return processo_service.listar(db)


@router.get("/{processo_id}", response_model=ProcessoOut)
def obter_processo(
    processo_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("processos:read")),
):
    return processo_service.obter_ou_404(db, processo_id)


@router.post("", response_model=ProcessoOut, status_code=201)
def criar_processo(
    dados: ProcessoCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("processos:write")),
):
    return processo_service.criar(db, dados)


@router.patch("/{processo_id}", response_model=ProcessoOut)
def atualizar_processo(
    processo_id: int,
    dados: ProcessoUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("processos:write")),
):
    return processo_service.atualizar(db, processo_id, dados)


@router.delete("/{processo_id}", status_code=204)
def remover_processo(
    processo_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("processos:write")),
):
    processo_service.remover(db, processo_id)
