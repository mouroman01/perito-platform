import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.documento import Documento
from app.models.usuario import Usuario
from app.services import storage_service

TAMANHO_MAXIMO_BYTES = 25 * 1024 * 1024  # 25 MB


def _query_base():
    return select(Documento).options(joinedload(Documento.enviado_por))


def listar_por_processo(db: Session, processo_id: int) -> list[Documento]:
    return list(
        db.scalars(_query_base().where(Documento.processo_id == processo_id).order_by(Documento.criado_em.desc()))
    )


def obter_ou_404(db: Session, documento_id: int) -> Documento:
    documento = db.scalar(_query_base().where(Documento.id == documento_id))
    if documento is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Documento não encontrado")
    return documento


async def enviar(
    db: Session,
    processo_id: int,
    arquivo: UploadFile,
    categoria: str | None,
    usuario: Usuario,
) -> Documento:
    conteudo = await arquivo.read()
    if len(conteudo) > TAMANHO_MAXIMO_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Arquivo excede o limite de 25 MB",
        )

    extensao = Path(arquivo.filename or "").suffix
    nome_armazenado = f"{uuid.uuid4().hex}{extensao}"
    chave = storage_service.chave_documento(processo_id, nome_armazenado)
    storage_service.salvar_objeto(chave, conteudo, arquivo.content_type)

    documento = Documento(
        nome_original=arquivo.filename or nome_armazenado,
        nome_armazenado=nome_armazenado,
        categoria=categoria,
        tamanho_bytes=len(conteudo),
        content_type=arquivo.content_type,
        processo_id=processo_id,
        enviado_por_id=usuario.id,
    )
    db.add(documento)
    db.commit()
    db.refresh(documento)
    return obter_ou_404(db, documento.id)


def baixar_conteudo(documento: Documento) -> bytes:
    chave = storage_service.chave_documento(documento.processo_id, documento.nome_armazenado)
    return storage_service.baixar_objeto(chave)


def remover(db: Session, documento_id: int) -> None:
    documento = obter_ou_404(db, documento_id)
    chave = storage_service.chave_documento(documento.processo_id, documento.nome_armazenado)
    db.delete(documento)
    db.commit()
    storage_service.remover_objeto(chave)
