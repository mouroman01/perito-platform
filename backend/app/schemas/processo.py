from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from app.models.processo import SituacaoProcesso
from app.schemas.cliente import ClienteOut
from app.schemas.comarca import ComarcaOut
from app.schemas.magistrado import MagistradoOut


class ProcessoBase(BaseModel):
    numero: str = Field(min_length=1, max_length=50)
    partes: str | None = None
    objeto: str | None = None
    especialidade: str | None = Field(default=None, max_length=100)
    prazo: date | None = None
    observacoes: str | None = None
    comarca_id: int
    magistrado_id: int | None = None
    cliente_id: int | None = None


class ProcessoCreate(ProcessoBase):
    pass


class ProcessoUpdate(BaseModel):
    numero: str | None = Field(default=None, min_length=1, max_length=50)
    partes: str | None = None
    objeto: str | None = None
    especialidade: str | None = Field(default=None, max_length=100)
    prazo: date | None = None
    situacao: SituacaoProcesso | None = None
    observacoes: str | None = None
    comarca_id: int | None = None
    magistrado_id: int | None = None
    cliente_id: int | None = None


class ProcessoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    numero: str
    partes: str | None
    objeto: str | None
    especialidade: str | None
    prazo: date | None
    situacao: SituacaoProcesso
    observacoes: str | None
    comarca: ComarcaOut
    magistrado: MagistradoOut | None
    cliente: ClienteOut | None
