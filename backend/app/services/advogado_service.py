from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.advogado import Advogado
from app.schemas.advogado import AdvogadoCreate, AdvogadoUpdate


def listar(db: Session) -> list[Advogado]:
    return list(
        db.scalars(select(Advogado).options(joinedload(Advogado.escritorio)).order_by(Advogado.nome))
    )


def obter_ou_404(db: Session, advogado_id: int) -> Advogado:
    advogado = db.get(Advogado, advogado_id)
    if advogado is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Advogado não encontrado")
    return advogado


def criar(db: Session, dados: AdvogadoCreate) -> Advogado:
    advogado = Advogado(**dados.model_dump())
    db.add(advogado)
    db.commit()
    db.refresh(advogado)
    return advogado


def atualizar(db: Session, advogado_id: int, dados: AdvogadoUpdate) -> Advogado:
    advogado = obter_ou_404(db, advogado_id)
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(advogado, campo, valor)
    db.commit()
    db.refresh(advogado)
    return advogado


def remover(db: Session, advogado_id: int) -> None:
    advogado = obter_ou_404(db, advogado_id)
    db.delete(advogado)
    db.commit()
