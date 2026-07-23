from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class EmbeddingBusca(Base):
    """Índice de embeddings para a pesquisa semântica (RF015).

    Cada linha guarda o vetor de embedding (Gemini `text-embedding-004`) de um item
    textual do sistema (laudo, evidência ou documento). Como o pgvector não está
    disponível nesta instalação, o vetor é serializado em JSON (`Text`) e a
    similaridade de cosseno é calculada em Python no momento da busca.
    """

    __tablename__ = "embeddings_busca"

    id: Mapped[int] = mapped_column(primary_key=True)
    tipo_entidade: Mapped[str] = mapped_column(String(20), nullable=False)  # laudo | evidencia | documento
    entidade_id: Mapped[int] = mapped_column(Integer, nullable=False)
    processo_id: Mapped[int | None] = mapped_column(Integer)
    titulo: Mapped[str] = mapped_column(String(255), nullable=False)
    texto: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[str] = mapped_column(Text, nullable=False)  # JSON: lista de floats
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
