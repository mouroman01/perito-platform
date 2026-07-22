from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_permission
from app.models.usuario import Usuario
from app.schemas.cliente import ClienteCreate, ClienteOut, ClienteUpdate
from app.services import cliente_service

router = APIRouter(prefix="/clientes", tags=["crm"])


@router.get("", response_model=list[ClienteOut])
def listar_clientes(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("crm:read")),
):
    return cliente_service.listar(db)


@router.post("", response_model=ClienteOut, status_code=201)
def criar_cliente(
    dados: ClienteCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("crm:write")),
):
    return cliente_service.criar(db, dados)


@router.patch("/{cliente_id}", response_model=ClienteOut)
def atualizar_cliente(
    cliente_id: int,
    dados: ClienteUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("crm:write")),
):
    return cliente_service.atualizar(db, cliente_id, dados)


@router.delete("/{cliente_id}", status_code=204)
def remover_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("crm:write")),
):
    cliente_service.remover(db, cliente_id)
