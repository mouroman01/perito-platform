from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class LogAuditoria(Base):
    __tablename__ = "logs_auditoria"

    id: Mapped[int] = mapped_column(primary_key=True)
    metodo: Mapped[str] = mapped_column(String(10), nullable=False)
    caminho: Mapped[str] = mapped_column(String(255), nullable=False)
    status_code: Mapped[int] = mapped_column(Integer, nullable=False)
    ip: Mapped[str | None] = mapped_column(String(45))

    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))
    usuario: Mapped["Usuario | None"] = relationship()

    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
