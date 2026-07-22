from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models.processo import Processo
from app.schemas.processo import ProcessoCreate, ProcessoUpdate


def _query_base():
    return select(Processo).options(
        joinedload(Processo.comarca),
        joinedload(Processo.magistrado),
        joinedload(Processo.cliente),
    )


def listar(db: Session) -> list[Processo]:
    return list(db.scalars(_query_base().order_by(Processo.criado_em.desc())))


def obter_ou_404(db: Session, processo_id: int) -> Processo:
    processo = db.scalar(_query_base().where(Processo.id == processo_id))
    if processo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Processo não encontrado")
    return processo


def criar(db: Session, dados: ProcessoCreate) -> Processo:
    processo = Processo(**dados.model_dump())
    db.add(processo)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe um processo cadastrado com este número",
        )
    db.refresh(processo)
    return obter_ou_404(db, processo.id)


def atualizar(db: Session, processo_id: int, dados: ProcessoUpdate) -> Processo:
    processo = obter_ou_404(db, processo_id)
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(processo, campo, valor)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe um processo cadastrado com este número",
        )
    return obter_ou_404(db, processo_id)


def remover(db: Session, processo_id: int) -> None:
    processo = obter_ou_404(db, processo_id)
    db.delete(processo)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Não é possível remover: existem documentos ou compromissos vinculados a este processo",
        )
