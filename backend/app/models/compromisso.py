import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TipoCompromisso(str, enum.Enum):
    AUDIENCIA = "audiencia"
    PERICIA = "pericia"
    DILIGENCIA = "diligencia"
    ENTREGA_LAUDO = "entrega_laudo"
    REUNIAO = "reuniao"
    LEMBRETE = "lembrete"


class Compromisso(Base):
    __tablename__ = "compromissos"

    id: Mapped[int] = mapped_column(primary_key=True)
    titulo: Mapped[str] = mapped_column(String(150), nullable=False)
    tipo: Mapped[TipoCompromisso] = mapped_column(Enum(TipoCompromisso, native_enum=False), nullable=False)
    data_hora: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    local: Mapped[str | None] = mapped_column(String(255))
    concluido: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    observacoes: Mapped[str | None] = mapped_column(Text)

    processo_id: Mapped[int | None] = mapped_column(ForeignKey("processos.id"))
    processo: Mapped["Processo | None"] = relationship()

    responsavel_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))
    responsavel: Mapped["Usuario | None"] = relationship()

    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
