import enum
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TipoEvidencia(str, enum.Enum):
    FOTO = "foto"
    VIDEO = "video"
    AUDIO = "audio"
    PDF = "pdf"
    WORD = "word"
    PLANILHA = "planilha"
    LOG = "log"
    OUTRO = "outro"


class MidiaOrigemEvidencia(str, enum.Enum):
    HD = "hd"
    SSD = "ssd"
    PENDRIVE = "pendrive"
    OUTRO = "outro"


class Evidencia(Base):
    __tablename__ = "evidencias"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome_original: Mapped[str] = mapped_column(String(255), nullable=False)
    nome_armazenado: Mapped[str] = mapped_column(String(255), nullable=False)
    tipo: Mapped[TipoEvidencia] = mapped_column(Enum(TipoEvidencia, native_enum=False), nullable=False)
    midia_origem: Mapped[MidiaOrigemEvidencia | None] = mapped_column(
        Enum(MidiaOrigemEvidencia, native_enum=False)
    )
    descricao: Mapped[str | None] = mapped_column(Text)
    hash_sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    tamanho_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    content_type: Mapped[str | None] = mapped_column(String(150))

    processo_id: Mapped[int] = mapped_column(ForeignKey("processos.id"), nullable=False)
    processo: Mapped["Processo"] = relationship()

    responsavel_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))
    responsavel: Mapped["Usuario | None"] = relationship()

    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
