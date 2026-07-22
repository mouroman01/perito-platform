from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.prospeccao import UsuarioResumo


class DocumentoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome_original: str
    categoria: str | None
    tamanho_bytes: int
    content_type: str | None
    processo_id: int
    enviado_por: UsuarioResumo | None
    criado_em: datetime
