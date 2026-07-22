from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_permission
from app.models.modelo import CategoriaModelo
from app.models.usuario import Usuario
from app.schemas.modelo import ModeloCreate, ModeloOut, ModeloUpdate
from app.services import modelo_service

router = APIRouter(prefix="/biblioteca/modelos", tags=["biblioteca"])


@router.get("", response_model=list[ModeloOut])
def listar_modelos(
    categoria: CategoriaModelo | None = Query(default=None),
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("biblioteca:read")),
):
    return modelo_service.listar(db, categoria)


@router.post("", response_model=ModeloOut, status_code=201)
def criar_modelo(
    dados: ModeloCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("biblioteca:write")),
):
    return modelo_service.criar(db, dados)


@router.patch("/{modelo_id}", response_model=ModeloOut)
def atualizar_modelo(
    modelo_id: int,
    dados: ModeloUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("biblioteca:write")),
):
    return modelo_service.atualizar(db, modelo_id, dados)


@router.delete("/{modelo_id}", status_code=204)
def remover_modelo(
    modelo_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("biblioteca:write")),
):
    modelo_service.remover(db, modelo_id)
