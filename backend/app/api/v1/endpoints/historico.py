from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.usuario import Usuario
from app.schemas.historico_alteracao import HistoricoAlteracaoOut
from app.services import historico_service

router = APIRouter(prefix="/historico", tags=["historico"])


@router.get("", response_model=list[HistoricoAlteracaoOut])
def listar_historico(
    entidade: str = Query(...),
    entidade_id: int = Query(...),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    permissao_necessaria = historico_service.PERMISSAO_POR_ENTIDADE.get(entidade)
    if permissao_necessaria is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entidade inválida")

    permissoes = usuario.perfil.permissoes or []
    if "*" not in permissoes and permissao_necessaria not in permissoes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário sem permissão para esta ação",
        )

    return historico_service.listar(db, entidade, entidade_id)
