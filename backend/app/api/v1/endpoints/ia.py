from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_permission
from app.models.usuario import Usuario
from app.schemas.ia import (
    EstruturaLaudoRequest,
    EstruturaResponse,
    ResumirRequest,
    ResumoResponse,
)
from app.services import ia_service, processo_service

router = APIRouter(prefix="/ia", tags=["ia"])


@router.post("/resumir", response_model=ResumoResponse)
def resumir_texto(
    dados: ResumirRequest,
    _: Usuario = Depends(require_permission("ia:usar")),
):
    return ResumoResponse(resumo=ia_service.resumir(dados.texto))


@router.post("/estrutura-laudo", response_model=EstruturaResponse)
def sugerir_estrutura_laudo(
    dados: EstruturaLaudoRequest,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("ia:usar")),
):
    if dados.processo_id is not None:
        processo = processo_service.obter_ou_404(db, dados.processo_id)
        contexto = (
            f"Número do processo: {processo.numero}\n"
            f"Comarca: {processo.comarca.nome}/{processo.comarca.uf}\n"
            f"Especialidade: {processo.especialidade or 'não informada'}\n"
            f"Objeto: {processo.objeto or 'não informado'}\n"
            f"Partes: {processo.partes or 'não informadas'}"
        )
    else:
        contexto = dados.contexto

    return EstruturaResponse(estrutura=ia_service.sugerir_estrutura_laudo(contexto))
