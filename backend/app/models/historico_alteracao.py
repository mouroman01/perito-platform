from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class HistoricoAlteracao(Base):
    __tablename__ = "historico_alteracoes"

    id: Mapped[int] = mapped_column(primary_key=True)
    entidade: Mapped[str] = mapped_column(String(50), nullable=False)
    entidade_id: Mapped[int] = mapped_column(Integer, nullable=False)
    campo: Mapped[str] = mapped_column(String(100), nullable=False)
    valor_anterior: Mapped[str | None] = mapped_column(Text)
    valor_novo: Mapped[str | None] = mapped_column(Text)

    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))
    usuario: Mapped["Usuario | None"] = relationship()

    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
