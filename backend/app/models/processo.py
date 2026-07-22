import enum
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SituacaoProcesso(str, enum.Enum):
    ACEITE = "aceite"
    ANALISE = "analise"
    COLETA = "coleta"
    PERICIA = "pericia"
    LAUDO = "laudo"
    ENTREGA = "entrega"
    ARQUIVADO = "arquivado"


class Processo(Base):
    __tablename__ = "processos"

    id: Mapped[int] = mapped_column(primary_key=True)
    numero: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    partes: Mapped[str | None] = mapped_column(Text)
    objeto: Mapped[str | None] = mapped_column(Text)
    especialidade: Mapped[str | None] = mapped_column(String(100))
    prazo: Mapped[date | None] = mapped_column(Date)
    situacao: Mapped[SituacaoProcesso] = mapped_column(
        Enum(SituacaoProcesso, native_enum=False),
        nullable=False,
        default=SituacaoProcesso.ACEITE,
    )
    observacoes: Mapped[str | None] = mapped_column(Text)

    comarca_id: Mapped[int] = mapped_column(ForeignKey("comarcas.id"), nullable=False)
    comarca: Mapped["Comarca"] = relationship()

    magistrado_id: Mapped[int | None] = mapped_column(ForeignKey("magistrados.id"))
    magistrado: Mapped["Magistrado | None"] = relationship()

    cliente_id: Mapped[int | None] = mapped_column(ForeignKey("clientes.id"))
    cliente: Mapped["Cliente | None"] = relationship()

    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
