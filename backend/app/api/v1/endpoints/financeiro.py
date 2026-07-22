from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_permission
from app.models.lancamento import TipoLancamento
from app.models.usuario import Usuario
from app.schemas.lancamento import LancamentoCreate, LancamentoOut, LancamentoUpdate
from app.services import lancamento_service

router = APIRouter(prefix="/financeiro", tags=["financeiro"])


@router.get("", response_model=list[LancamentoOut])
def listar_lancamentos(
    tipo: TipoLancamento | None = Query(default=None),
    somente_impostos: bool = Query(default=False),
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("financeiro:read")),
):
    return lancamento_service.listar(db, tipo, somente_impostos)


@router.post("", response_model=LancamentoOut, status_code=201)
def criar_lancamento(
    dados: LancamentoCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("financeiro:write")),
):
    return lancamento_service.criar(db, dados)


@router.patch("/{lancamento_id}", response_model=LancamentoOut)
def atualizar_lancamento(
    lancamento_id: int,
    dados: LancamentoUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("financeiro:write")),
):
    return lancamento_service.atualizar(db, lancamento_id, dados)


@router.delete("/{lancamento_id}", status_code=204)
def remover_lancamento(
    lancamento_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("financeiro:write")),
):
    lancamento_service.remover(db, lancamento_id)
