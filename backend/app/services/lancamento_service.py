from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.lancamento import Lancamento, TipoLancamento
from app.schemas.lancamento import LancamentoCreate, LancamentoUpdate


def _query_base():
    return select(Lancamento).options(joinedload(Lancamento.processo))


def listar(
    db: Session, tipo: TipoLancamento | None = None, somente_impostos: bool = False
) -> list[Lancamento]:
    query = _query_base().order_by(Lancamento.vencimento.desc())
    if tipo is not None:
        query = query.where(Lancamento.tipo == tipo)
    if somente_impostos:
        query = query.where(Lancamento.tipo_imposto.isnot(None))
    return list(db.scalars(query))


def obter_ou_404(db: Session, lancamento_id: int) -> Lancamento:
    lancamento = db.scalar(_query_base().where(Lancamento.id == lancamento_id))
    if lancamento is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lançamento não encontrado")
    return lancamento


def criar(db: Session, dados: LancamentoCreate) -> Lancamento:
    lancamento = Lancamento(**dados.model_dump())
    db.add(lancamento)
    db.commit()
    db.refresh(lancamento)
    return obter_ou_404(db, lancamento.id)


def atualizar(db: Session, lancamento_id: int, dados: LancamentoUpdate) -> Lancamento:
    lancamento = obter_ou_404(db, lancamento_id)
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(lancamento, campo, valor)
    db.commit()
    return obter_ou_404(db, lancamento_id)


def remover(db: Session, lancamento_id: int) -> None:
    lancamento = obter_ou_404(db, lancamento_id)
    db.delete(lancamento)
    db.commit()
