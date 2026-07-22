from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_permission
from app.models.usuario import Usuario
from app.schemas.comarca import ComarcaCreate, ComarcaOut, ComarcaUpdate
from app.services import comarca_service

router = APIRouter(prefix="/comarcas", tags=["crm"])


@router.get("", response_model=list[ComarcaOut])
def listar_comarcas(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("crm:read")),
):
    return comarca_service.listar(db)


@router.post("", response_model=ComarcaOut, status_code=201)
def criar_comarca(
    dados: ComarcaCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("crm:write")),
):
    return comarca_service.criar(db, dados)


@router.patch("/{comarca_id}", response_model=ComarcaOut)
def atualizar_comarca(
    comarca_id: int,
    dados: ComarcaUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("crm:write")),
):
    return comarca_service.atualizar(db, comarca_id, dados)


@router.delete("/{comarca_id}", status_code=204)
def remover_comarca(
    comarca_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("crm:write")),
):
    comarca_service.remover(db, comarca_id)
