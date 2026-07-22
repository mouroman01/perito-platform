from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.compromisso import Compromisso
from app.schemas.compromisso import CompromissoCreate, CompromissoUpdate


def _query_base():
    return select(Compromisso).options(
        joinedload(Compromisso.processo),
        joinedload(Compromisso.responsavel),
    )


def listar(db: Session, processo_id: int | None = None) -> list[Compromisso]:
    query = _query_base().order_by(Compromisso.data_hora)
    if processo_id is not None:
        query = query.where(Compromisso.processo_id == processo_id)
    return list(db.scalars(query))


def obter_ou_404(db: Session, compromisso_id: int) -> Compromisso:
    compromisso = db.scalar(_query_base().where(Compromisso.id == compromisso_id))
    if compromisso is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compromisso não encontrado")
    return compromisso


def criar(db: Session, dados: CompromissoCreate) -> Compromisso:
    compromisso = Compromisso(**dados.model_dump())
    db.add(compromisso)
    db.commit()
    db.refresh(compromisso)
    return obter_ou_404(db, compromisso.id)


def atualizar(db: Session, compromisso_id: int, dados: CompromissoUpdate) -> Compromisso:
    compromisso = obter_ou_404(db, compromisso_id)
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(compromisso, campo, valor)
    db.commit()
    return obter_ou_404(db, compromisso_id)


def remover(db: Session, compromisso_id: int) -> None:
    compromisso = obter_ou_404(db, compromisso_id)
    db.delete(compromisso)
    db.commit()
