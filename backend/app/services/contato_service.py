from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.contato import Contato
from app.schemas.contato import ContatoCreate, ContatoUpdate


def listar(db: Session) -> list[Contato]:
    return list(db.scalars(select(Contato).order_by(Contato.nome)))


def obter_ou_404(db: Session, contato_id: int) -> Contato:
    contato = db.get(Contato, contato_id)
    if contato is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contato não encontrado")
    return contato


def criar(db: Session, dados: ContatoCreate) -> Contato:
    contato = Contato(**dados.model_dump())
    db.add(contato)
    db.commit()
    db.refresh(contato)
    return contato


def atualizar(db: Session, contato_id: int, dados: ContatoUpdate) -> Contato:
    contato = obter_ou_404(db, contato_id)
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(contato, campo, valor)
    db.commit()
    db.refresh(contato)
    return contato


def remover(db: Session, contato_id: int) -> None:
    contato = obter_ou_404(db, contato_id)
    db.delete(contato)
    db.commit()
