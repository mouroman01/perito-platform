import hashlib
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.evidencia import Evidencia, MidiaOrigemEvidencia, TipoEvidencia
from app.models.usuario import Usuario
from app.services import storage_service

TAMANHO_MAXIMO_BYTES = 200 * 1024 * 1024  # 200 MB — evidências incluem vídeos e imagens periciais


def _query_base():
    return select(Evidencia).options(joinedload(Evidencia.responsavel))


def listar_por_processo(db: Session, processo_id: int) -> list[Evidencia]:
    return list(
        db.scalars(
            _query_base().where(Evidencia.processo_id == processo_id).order_by(Evidencia.criado_em.desc())
        )
    )


def obter_ou_404(db: Session, evidencia_id: int) -> Evidencia:
    evidencia = db.scalar(_query_base().where(Evidencia.id == evidencia_id))
    if evidencia is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evidência não encontrada")
    return evidencia


async def enviar(
    db: Session,
    processo_id: int,
    arquivo: UploadFile,
    tipo: TipoEvidencia,
    midia_origem: MidiaOrigemEvidencia | None,
    descricao: str | None,
    usuario: Usuario,
) -> Evidencia:
    conteudo = await arquivo.read()
    if len(conteudo) > TAMANHO_MAXIMO_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Arquivo excede o limite de 200 MB",
        )

    extensao = Path(arquivo.filename or "").suffix
    nome_armazenado = f"{uuid.uuid4().hex}{extensao}"
    chave = storage_service.chave_evidencia(processo_id, nome_armazenado)
    storage_service.salvar_objeto(chave, conteudo, arquivo.content_type)

    evidencia = Evidencia(
        nome_original=arquivo.filename or nome_armazenado,
        nome_armazenado=nome_armazenado,
        tipo=tipo,
        midia_origem=midia_origem,
        descricao=descricao,
        hash_sha256=hashlib.sha256(conteudo).hexdigest(),
        tamanho_bytes=len(conteudo),
        content_type=arquivo.content_type,
        processo_id=processo_id,
        responsavel_id=usuario.id,
    )
    db.add(evidencia)
    db.commit()
    db.refresh(evidencia)
    return obter_ou_404(db, evidencia.id)


def baixar_conteudo(evidencia: Evidencia) -> bytes:
    chave = storage_service.chave_evidencia(evidencia.processo_id, evidencia.nome_armazenado)
    return storage_service.baixar_objeto(chave)


def remover(db: Session, evidencia_id: int) -> None:
    evidencia = obter_ou_404(db, evidencia_id)
    chave = storage_service.chave_evidencia(evidencia.processo_id, evidencia.nome_armazenado)
    db.delete(evidencia)
    db.commit()
    storage_service.remover_objeto(chave)
