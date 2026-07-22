import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class StatusLaudo(str, enum.Enum):
    RASCUNHO = "rascunho"
    EM_REVISAO = "em_revisao"
    FINALIZADO = "finalizado"
    ENTREGUE = "entregue"


class Laudo(Base):
    __tablename__ = "laudos"

    id: Mapped[int] = mapped_column(primary_key=True)
    titulo: Mapped[str] = mapped_column(String(255), nullable=False)
    conteudo: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[StatusLaudo] = mapped_column(
        Enum(StatusLaudo, native_enum=False), nullable=False, default=StatusLaudo.RASCUNHO
    )

    processo_id: Mapped[int] = mapped_column(ForeignKey("processos.id"), nullable=False)
    processo: Mapped["Processo"] = relationship()

    modelo_id: Mapped[int | None] = mapped_column(ForeignKey("modelos.id"))
    modelo: Mapped["Modelo | None"] = relationship()

    criado_por_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))
    criado_por: Mapped["Usuario | None"] = relationship()

    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
