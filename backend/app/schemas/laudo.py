from pydantic import BaseModel, ConfigDict, Field

from app.models.laudo import StatusLaudo
from app.schemas.prospeccao import UsuarioResumo


class ProcessoResumoLaudo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    numero: str


class ModeloResumo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str


class LaudoBase(BaseModel):
    titulo: str = Field(min_length=2, max_length=255)
    processo_id: int
    modelo_id: int | None = None


class LaudoCreate(LaudoBase):
    conteudo: str = ""


class LaudoUpdate(BaseModel):
    titulo: str | None = Field(default=None, min_length=2, max_length=255)
    conteudo: str | None = None
    status: StatusLaudo | None = None


class LaudoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    titulo: str
    conteudo: str
    status: StatusLaudo
    processo: ProcessoResumoLaudo
    modelo: ModeloResumo | None
    criado_por: UsuarioResumo | None
