import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class CategoriaModelo(str, enum.Enum):
    CONTRATO = "contrato"
    LAUDO = "laudo"
    QUESITO = "quesito"
    PARECER = "parecer"
    RECIBO = "recibo"
    PROPOSTA = "proposta"


class Modelo(Base):
    __tablename__ = "modelos"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    categoria: Mapped[CategoriaModelo] = mapped_column(Enum(CategoriaModelo, native_enum=False), nullable=False)
    conteudo: Mapped[str] = mapped_column(Text, nullable=False)
    descricao: Mapped[str | None] = mapped_column(String(500))

    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
