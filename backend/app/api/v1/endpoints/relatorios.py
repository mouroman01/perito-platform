from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_permission
from app.models.usuario import Usuario
from app.schemas.relatorio import IndicadoresOut
from app.services import relatorio_service

router = APIRouter(prefix="/relatorios", tags=["relatorios"])


@router.get("/indicadores", response_model=IndicadoresOut)
def obter_indicadores(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("relatorios:read")),
):
    return relatorio_service.obter_indicadores(db)
