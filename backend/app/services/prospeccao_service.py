from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.prospeccao import Prospeccao
from app.schemas.prospeccao import ProspeccaoCreate, ProspeccaoUpdate


def listar(db: Session) -> list[Prospeccao]:
    return list(
        db.scalars(
            select(Prospeccao)
            .options(joinedload(Prospeccao.cliente), joinedload(Prospeccao.responsavel))
            .order_by(Prospeccao.criado_em.desc())
        )
    )


def obter_ou_404(db: Session, prospeccao_id: int) -> Prospeccao:
    prospeccao = db.get(Prospeccao, prospeccao_id)
    if prospeccao is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prospecção não encontrada")
    return prospeccao


def criar(db: Session, dados: ProspeccaoCreate) -> Prospeccao:
    prospeccao = Prospeccao(**dados.model_dump())
    db.add(prospeccao)
    db.commit()
    db.refresh(prospeccao)
    return prospeccao


def atualizar(db: Session, prospeccao_id: int, dados: ProspeccaoUpdate) -> Prospeccao:
    prospeccao = obter_ou_404(db, prospeccao_id)
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(prospeccao, campo, valor)
    db.commit()
    db.refresh(prospeccao)
    return prospeccao


def remover(db: Session, prospeccao_id: int) -> None:
    prospeccao = obter_ou_404(db, prospeccao_id)
    db.delete(prospeccao)
    db.commit()
