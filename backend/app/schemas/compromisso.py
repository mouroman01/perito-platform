from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.compromisso import TipoCompromisso
from app.schemas.prospeccao import UsuarioResumo


class ProcessoResumo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    numero: str


class CompromissoBase(BaseModel):
    titulo: str = Field(min_length=2, max_length=150)
    tipo: TipoCompromisso
    data_hora: datetime
    local: str | None = Field(default=None, max_length=255)
    observacoes: str | None = None
    processo_id: int | None = None
    responsavel_id: int | None = None


class CompromissoCreate(CompromissoBase):
    pass


class CompromissoUpdate(BaseModel):
    titulo: str | None = Field(default=None, min_length=2, max_length=150)
    tipo: TipoCompromisso | None = None
    data_hora: datetime | None = None
    local: str | None = Field(default=None, max_length=255)
    concluido: bool | None = None
    observacoes: str | None = None
    processo_id: int | None = None
    responsavel_id: int | None = None


class CompromissoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    titulo: str
    tipo: TipoCompromisso
    data_hora: datetime
    local: str | None
    concluido: bool
    observacoes: str | None
    processo: ProcessoResumo | None
    responsavel: UsuarioResumo | None
