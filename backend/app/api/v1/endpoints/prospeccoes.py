from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_permission
from app.models.usuario import Usuario
from app.schemas.prospeccao import ProspeccaoCreate, ProspeccaoOut, ProspeccaoUpdate
from app.services import prospeccao_service

router = APIRouter(prefix="/prospeccoes", tags=["crm"])


@router.get("", response_model=list[ProspeccaoOut])
def listar_prospeccoes(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("crm:read")),
):
    return prospeccao_service.listar(db)


@router.post("", response_model=ProspeccaoOut, status_code=201)
def criar_prospeccao(
    dados: ProspeccaoCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("crm:write")),
):
    return prospeccao_service.criar(db, dados)


@router.patch("/{prospeccao_id}", response_model=ProspeccaoOut)
def atualizar_prospeccao(
    prospeccao_id: int,
    dados: ProspeccaoUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("crm:write")),
):
    return prospeccao_service.atualizar(db, prospeccao_id, dados)


@router.delete("/{prospeccao_id}", status_code=204)
def remover_prospeccao(
    prospeccao_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("crm:write")),
):
    prospeccao_service.remover(db, prospeccao_id)
