from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.prospeccao import UsuarioResumo


class HistoricoAlteracaoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    campo: str
    valor_anterior: str | None
    valor_novo: str | None
    usuario: UsuarioResumo | None
    criado_em: datetime
