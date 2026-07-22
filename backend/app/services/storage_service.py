"""Camada de armazenamento de objetos (MinIO / S3-compatível).

Os documentos dos processos ficam no bucket configurado em MINIO_BUCKET,
usando a chave "{processo_id}/{nome_armazenado}" — o mesmo esquema de pastas
usado quando o armazenamento era em disco local.
"""

from io import BytesIO

from minio import Minio

from app.core.config import settings

_cliente: Minio | None = None


def _obter_cliente() -> Minio:
    global _cliente
    if _cliente is None:
        _cliente = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        if not _cliente.bucket_exists(settings.MINIO_BUCKET):
            _cliente.make_bucket(settings.MINIO_BUCKET)
    return _cliente


def chave_documento(processo_id: int, nome_armazenado: str) -> str:
    return f"{processo_id}/{nome_armazenado}"


def chave_evidencia(processo_id: int, nome_armazenado: str) -> str:
    return f"evidencias/{processo_id}/{nome_armazenado}"


def salvar_objeto(chave: str, conteudo: bytes, content_type: str | None) -> None:
    cliente = _obter_cliente()
    cliente.put_object(
        settings.MINIO_BUCKET,
        chave,
        BytesIO(conteudo),
        length=len(conteudo),
        content_type=content_type or "application/octet-stream",
    )


def baixar_objeto(chave: str) -> bytes:
    cliente = _obter_cliente()
    resposta = cliente.get_object(settings.MINIO_BUCKET, chave)
    try:
        return resposta.read()
    finally:
        resposta.close()
        resposta.release_conn()


def remover_objeto(chave: str) -> None:
    cliente = _obter_cliente()
    cliente.remove_object(settings.MINIO_BUCKET, chave)
