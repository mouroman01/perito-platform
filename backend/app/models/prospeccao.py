import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class EstagioProspeccao(str, enum.Enum):
    PROSPECCAO = "prospeccao"
    CONTATO = "contato"
    RESPOSTA = "resposta"
    NOMEACAO = "nomeacao"
    PERDIDA = "perdida"


class Prospeccao(Base):
    __tablename__ = "prospeccoes"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    estagio: Mapped[EstagioProspeccao] = mapped_column(
        Enum(EstagioProspeccao, native_enum=False),
        nullable=False,
        default=EstagioProspeccao.PROSPECCAO,
    )
    origem: Mapped[str | None] = mapped_column(String(100))
    contato: Mapped[str | None] = mapped_column(String(255))
    observacoes: Mapped[str | None] = mapped_column(String(1000))

    cliente_id: Mapped[int | None] = mapped_column(ForeignKey("clientes.id"))
    cliente: Mapped["Cliente | None"] = relationship(back_populates="prospeccoes")

    responsavel_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))
    responsavel: Mapped["Usuario | None"] = relationship()

    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
