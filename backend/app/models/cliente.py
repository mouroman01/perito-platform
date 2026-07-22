import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TipoPessoa(str, enum.Enum):
    FISICA = "pessoa_fisica"
    JURIDICA = "pessoa_juridica"


class Cliente(Base):
    __tablename__ = "clientes"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    tipo: Mapped[TipoPessoa] = mapped_column(Enum(TipoPessoa, native_enum=False), nullable=False)
    documento: Mapped[str | None] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(255))
    telefone: Mapped[str | None] = mapped_column(String(30))
    observacoes: Mapped[str | None] = mapped_column(String(1000))

    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    prospeccoes: Mapped[list["Prospeccao"]] = relationship(back_populates="cliente")
