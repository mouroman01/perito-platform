from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_permission
from app.models.usuario import Usuario
from app.schemas.contato import ContatoCreate, ContatoOut, ContatoUpdate
from app.services import contato_service

router = APIRouter(prefix="/contatos", tags=["crm"])


@router.get("", response_model=list[ContatoOut])
def listar_contatos(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("crm:read")),
):
    return contato_service.listar(db)


@router.post("", response_model=ContatoOut, status_code=201)
def criar_contato(
    dados: ContatoCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("crm:write")),
):
    return contato_service.criar(db, dados)


@router.patch("/{contato_id}", response_model=ContatoOut)
def atualizar_contato(
    contato_id: int,
    dados: ContatoUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("crm:write")),
):
    return contato_service.atualizar(db, contato_id, dados)


@router.delete("/{contato_id}", status_code=204)
def remover_contato(
    contato_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("crm:write")),
):
    contato_service.remover(db, contato_id)
