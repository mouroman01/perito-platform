from pydantic import BaseModel, ConfigDict, Field

from app.models.cliente import TipoPessoa


class ClienteBase(BaseModel):
    nome: str = Field(min_length=2, max_length=150)
    tipo: TipoPessoa
    documento: str | None = Field(default=None, max_length=20)
    email: str | None = Field(default=None, max_length=255)
    telefone: str | None = Field(default=None, max_length=30)
    observacoes: str | None = Field(default=None, max_length=1000)


class ClienteCreate(ClienteBase):
    pass


class ClienteUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=2, max_length=150)
    tipo: TipoPessoa | None = None
    documento: str | None = Field(default=None, max_length=20)
    email: str | None = Field(default=None, max_length=255)
    telefone: str | None = Field(default=None, max_length=30)
    observacoes: str | None = Field(default=None, max_length=1000)


class ClienteOut(ClienteBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
