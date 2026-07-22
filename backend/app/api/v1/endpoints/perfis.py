from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.perfil import Perfil
from app.models.usuario import Usuario
from app.schemas.perfil import PerfilOut

router = APIRouter(prefix="/perfis", tags=["perfis"])


@router.get("", response_model=list[PerfilOut])
def listar_perfis(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    return list(db.scalars(select(Perfil).order_by(Perfil.nome)))
