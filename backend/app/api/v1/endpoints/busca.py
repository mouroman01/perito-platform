from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.usuario import Usuario
from app.schemas.busca import ResultadoBusca
from app.services import busca_service

router = APIRouter(prefix="/busca", tags=["busca"])


@router.get("", response_model=list[ResultadoBusca])
def busca_global(
    q: str = Query(..., min_length=2),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    return busca_service.buscar(db, usuario, q)
