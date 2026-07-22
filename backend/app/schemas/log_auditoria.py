from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.prospeccao import UsuarioResumo


class LogAuditoriaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    metodo: str
    caminho: str
    status_code: int
    ip: str | None
    usuario: UsuarioResumo | None
    criado_em: datetime
