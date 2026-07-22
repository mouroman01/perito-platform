from fastapi import APIRouter, Depends, File, Form, Response, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_permission
from app.models.evidencia import MidiaOrigemEvidencia, TipoEvidencia
from app.models.usuario import Usuario
from app.schemas.evidencia import EvidenciaOut
from app.services import evidencia_service

router = APIRouter(tags=["evidencias"])


@router.get("/processos/{processo_id}/evidencias", response_model=list[EvidenciaOut])
def listar_evidencias(
    processo_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("processos:read")),
):
    return evidencia_service.listar_por_processo(db, processo_id)


@router.post("/processos/{processo_id}/evidencias", response_model=EvidenciaOut, status_code=201)
async def enviar_evidencia(
    processo_id: int,
    arquivo: UploadFile = File(...),
    tipo: TipoEvidencia = Form(...),
    midia_origem: MidiaOrigemEvidencia | None = Form(default=None),
    descricao: str | None = Form(default=None),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_permission("processos:write")),
):
    return await evidencia_service.enviar(db, processo_id, arquivo, tipo, midia_origem, descricao, usuario)


@router.get("/evidencias/{evidencia_id}/download")
def baixar_evidencia(
    evidencia_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("processos:read")),
):
    evidencia = evidencia_service.obter_ou_404(db, evidencia_id)
    conteudo = evidencia_service.baixar_conteudo(evidencia)
    return Response(
        content=conteudo,
        media_type=evidencia.content_type or "application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{evidencia.nome_original}"',
            "X-Hash-SHA256": evidencia.hash_sha256,
        },
    )


@router.delete("/evidencias/{evidencia_id}", status_code=204)
def remover_evidencia(
    evidencia_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("processos:write")),
):
    evidencia_service.remover(db, evidencia_id)
