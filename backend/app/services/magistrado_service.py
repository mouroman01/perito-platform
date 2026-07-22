from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.magistrado import Magistrado
from app.schemas.magistrado import MagistradoCreate, MagistradoUpdate


def listar(db: Session) -> list[Magistrado]:
    return list(
        db.scalars(select(Magistrado).options(joinedload(Magistrado.comarca)).order_by(Magistrado.nome))
    )


def obter_ou_404(db: Session, magistrado_id: int) -> Magistrado:
    magistrado = db.get(Magistrado, magistrado_id)
    if magistrado is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Magistrado não encontrado")
    return magistrado


def criar(db: Session, dados: MagistradoCreate) -> Magistrado:
    magistrado = Magistrado(**dados.model_dump())
    db.add(magistrado)
    db.commit()
    db.refresh(magistrado)
    return magistrado


def atualizar(db: Session, magistrado_id: int, dados: MagistradoUpdate) -> Magistrado:
    magistrado = obter_ou_404(db, magistrado_id)
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(magistrado, campo, valor)
    db.commit()
    db.refresh(magistrado)
    return magistrado


def remover(db: Session, magistrado_id: int) -> None:
    magistrado = obter_ou_404(db, magistrado_id)
    db.delete(magistrado)
    db.commit()
