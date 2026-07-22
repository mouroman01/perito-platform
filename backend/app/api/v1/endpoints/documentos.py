from fastapi import APIRouter, Depends, File, Form, Response, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_permission
from app.models.usuario import Usuario
from app.schemas.documento import DocumentoOut
from app.services import documento_service

router = APIRouter(tags=["documentos"])


@router.get("/processos/{processo_id}/documentos", response_model=list[DocumentoOut])
def listar_documentos(
    processo_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("processos:read")),
):
    return documento_service.listar_por_processo(db, processo_id)


@router.post("/processos/{processo_id}/documentos", response_model=DocumentoOut, status_code=201)
async def enviar_documento(
    processo_id: int,
    arquivo: UploadFile = File(...),
    categoria: str | None = Form(default=None),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_permission("processos:write")),
):
    return await documento_service.enviar(db, processo_id, arquivo, categoria, usuario)


@router.get("/documentos/{documento_id}/download")
def baixar_documento(
    documento_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("processos:read")),
):
    documento = documento_service.obter_ou_404(db, documento_id)
    conteudo = documento_service.baixar_conteudo(documento)
    return Response(
        content=conteudo,
        media_type=documento.content_type or "application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{documento.nome_original}"'},
    )


@router.delete("/documentos/{documento_id}", status_code=204)
def remover_documento(
    documento_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("processos:write")),
):
    documento_service.remover(db, documento_id)
