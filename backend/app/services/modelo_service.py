from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.modelo import CategoriaModelo, Modelo
from app.schemas.modelo import ModeloCreate, ModeloUpdate


def listar(db: Session, categoria: CategoriaModelo | None = None) -> list[Modelo]:
    query = select(Modelo).order_by(Modelo.nome)
    if categoria is not None:
        query = query.where(Modelo.categoria == categoria)
    return list(db.scalars(query))


def obter_ou_404(db: Session, modelo_id: int) -> Modelo:
    modelo = db.get(Modelo, modelo_id)
    if modelo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Modelo não encontrado")
    return modelo


def criar(db: Session, dados: ModeloCreate) -> Modelo:
    modelo = Modelo(**dados.model_dump())
    db.add(modelo)
    db.commit()
    db.refresh(modelo)
    return modelo


def atualizar(db: Session, modelo_id: int, dados: ModeloUpdate) -> Modelo:
    modelo = obter_ou_404(db, modelo_id)
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(modelo, campo, valor)
    db.commit()
    db.refresh(modelo)
    return modelo


def remover(db: Session, modelo_id: int) -> None:
    modelo = obter_ou_404(db, modelo_id)
    db.delete(modelo)
    db.commit()
