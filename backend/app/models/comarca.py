from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Comarca(Base):
    __tablename__ = "comarcas"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    uf: Mapped[str] = mapped_column(String(2), nullable=False)
    tribunal: Mapped[str | None] = mapped_column(String(50))

    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    magistrados: Mapped[list["Magistrado"]] = relationship(back_populates="comarca")
