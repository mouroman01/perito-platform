from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_permission
from app.models.usuario import Usuario
from app.schemas.laudo import LaudoCreate, LaudoOut, LaudoUpdate
from app.services import laudo_service

router = APIRouter(prefix="/laudos", tags=["laudos"])


@router.get("", response_model=list[LaudoOut])
def listar_laudos(
    processo_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("laudos:read")),
):
    return laudo_service.listar(db, processo_id)


@router.get("/{laudo_id}", response_model=LaudoOut)
def obter_laudo(
    laudo_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("laudos:read")),
):
    return laudo_service.obter_ou_404(db, laudo_id)


@router.post("", response_model=LaudoOut, status_code=201)
def criar_laudo(
    dados: LaudoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_permission("laudos:write")),
):
    return laudo_service.criar(db, dados, usuario)


@router.patch("/{laudo_id}", response_model=LaudoOut)
def atualizar_laudo(
    laudo_id: int,
    dados: LaudoUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("laudos:write")),
):
    return laudo_service.atualizar(db, laudo_id, dados)


@router.delete("/{laudo_id}", status_code=204)
def remover_laudo(
    laudo_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("laudos:write")),
):
    laudo_service.remover(db, laudo_id)


@router.get("/{laudo_id}/exportar-pdf")
def exportar_laudo_pdf(
    laudo_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("laudos:read")),
):
    laudo = laudo_service.obter_ou_404(db, laudo_id)
    pdf_bytes = laudo_service.gerar_pdf(laudo)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="laudo-{laudo_id}.pdf"'},
    )


@router.get("/{laudo_id}/exportar-word")
def exportar_laudo_word(
    laudo_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_permission("laudos:read")),
):
    laudo = laudo_service.obter_ou_404(db, laudo_id)
    docx_bytes = laudo_service.gerar_docx(laudo)
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="laudo-{laudo_id}.docx"'},
    )
