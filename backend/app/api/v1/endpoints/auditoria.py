from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_permission
from app.models.usuario import Usuario
from app.schemas.log_auditoria import LogAuditoriaOut
from app.services import log_auditoria_service

router = APIRouter(prefix="/auditoria", tags=["auditoria"])


@router.get("", response_model=list[LogAuditoriaOut])
def listar_auditoria(
    limite: int = Query(default=200, le=1000),
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("auditoria:read")),
):
    return log_auditoria_service.listar(db, limite)
