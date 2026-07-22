from pydantic import BaseModel, ConfigDict, Field

from app.models.prospeccao import EstagioProspeccao
from app.schemas.cliente import ClienteOut


class UsuarioResumo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str


class ProspeccaoBase(BaseModel):
    nome: str = Field(min_length=2, max_length=150)
    origem: str | None = Field(default=None, max_length=100)
    contato: str | None = Field(default=None, max_length=255)
    observacoes: str | None = Field(default=None, max_length=1000)
    cliente_id: int | None = None
    responsavel_id: int | None = None


class ProspeccaoCreate(ProspeccaoBase):
    pass


class ProspeccaoUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=2, max_length=150)
    estagio: EstagioProspeccao | None = None
    origem: str | None = Field(default=None, max_length=100)
    contato: str | None = Field(default=None, max_length=255)
    observacoes: str | None = Field(default=None, max_length=1000)
    cliente_id: int | None = None
    responsavel_id: int | None = None


class ProspeccaoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    estagio: EstagioProspeccao
    origem: str | None
    contato: str | None
    observacoes: str | None
    cliente: ClienteOut | None
    responsavel: UsuarioResumo | None
