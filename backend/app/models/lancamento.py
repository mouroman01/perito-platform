import enum
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TipoLancamento(str, enum.Enum):
    ENTRADA = "entrada"
    SAIDA = "saida"


class TipoImposto(str, enum.Enum):
    DARF_INSS = "darf_inss"
    DARF_IRPF = "darf_irpf"
    ISS = "iss"
    OUTRO = "outro"


class Lancamento(Base):
    __tablename__ = "lancamentos_financeiros"

    id: Mapped[int] = mapped_column(primary_key=True)
    tipo: Mapped[TipoLancamento] = mapped_column(Enum(TipoLancamento, native_enum=False), nullable=False)
    descricao: Mapped[str] = mapped_column(String(255), nullable=False)
    valor: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    vencimento: Mapped[date] = mapped_column(Date, nullable=False)
    pago_em: Mapped[date | None] = mapped_column(Date)
    observacoes: Mapped[str | None] = mapped_column(Text)

    tipo_imposto: Mapped[TipoImposto | None] = mapped_column(Enum(TipoImposto, native_enum=False))
    competencia: Mapped[date | None] = mapped_column(Date)

    processo_id: Mapped[int | None] = mapped_column(ForeignKey("processos.id"))
    processo: Mapped["Processo | None"] = relationship()

    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
