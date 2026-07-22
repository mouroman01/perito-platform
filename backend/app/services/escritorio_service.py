from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.advogado import Advogado
from app.models.escritorio import Escritorio
from app.schemas.escritorio import EscritorioCreate, EscritorioUpdate


def listar(db: Session) -> list[Escritorio]:
    return list(db.scalars(select(Escritorio).order_by(Escritorio.nome)))


def obter_ou_404(db: Session, escritorio_id: int) -> Escritorio:
    escritorio = db.get(Escritorio, escritorio_id)
    if escritorio is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Escritório não encontrado")
    return escritorio


def criar(db: Session, dados: EscritorioCreate) -> Escritorio:
    escritorio = Escritorio(**dados.model_dump())
    db.add(escritorio)
    db.commit()
    db.refresh(escritorio)
    return escritorio


def atualizar(db: Session, escritorio_id: int, dados: EscritorioUpdate) -> Escritorio:
    escritorio = obter_ou_404(db, escritorio_id)
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(escritorio, campo, valor)
    db.commit()
    db.refresh(escritorio)
    return escritorio


def remover(db: Session, escritorio_id: int) -> None:
    escritorio = obter_ou_404(db, escritorio_id)
    # Como advogados.escritorio_id é opcional (nullable), o SQLAlchemy desvincularia
    # os advogados automaticamente ao deletar o escritório. Bloqueamos explicitamente
    # para não orfanizar registros em silêncio — o usuário deve reatribuir/remover antes.
    vinculados = db.scalar(
        select(func.count()).select_from(Advogado).where(Advogado.escritorio_id == escritorio_id)
    )
    if vinculados:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Não é possível remover: existem advogados vinculados a este escritório",
        )
    db.delete(escritorio)
    db.commit()
