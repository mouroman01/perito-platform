from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.comarca import Comarca
from app.schemas.comarca import ComarcaCreate, ComarcaUpdate


def listar(db: Session) -> list[Comarca]:
    return list(db.scalars(select(Comarca).order_by(Comarca.nome)))


def obter_ou_404(db: Session, comarca_id: int) -> Comarca:
    comarca = db.get(Comarca, comarca_id)
    if comarca is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comarca não encontrada")
    return comarca


def criar(db: Session, dados: ComarcaCreate) -> Comarca:
    comarca = Comarca(**dados.model_dump())
    db.add(comarca)
    db.commit()
    db.refresh(comarca)
    return comarca


def atualizar(db: Session, comarca_id: int, dados: ComarcaUpdate) -> Comarca:
    comarca = obter_ou_404(db, comarca_id)
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(comarca, campo, valor)
    db.commit()
    db.refresh(comarca)
    return comarca


def remover(db: Session, comarca_id: int) -> None:
    comarca = obter_ou_404(db, comarca_id)
    db.delete(comarca)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Não é possível remover: existem magistrados vinculados a esta comarca",
        )
