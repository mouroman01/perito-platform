from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.escritorio import EscritorioOut


class AdvogadoBase(BaseModel):
    nome: str = Field(min_length=2, max_length=150)
    oab: str | None = Field(default=None, max_length=30)
    email: EmailStr | None = None
    telefone: str | None = Field(default=None, max_length=30)
    observacoes: str | None = Field(default=None, max_length=1000)
    escritorio_id: int | None = None


class AdvogadoCreate(AdvogadoBase):
    pass


class AdvogadoUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=2, max_length=150)
    oab: str | None = Field(default=None, max_length=30)
    email: EmailStr | None = None
    telefone: str | None = Field(default=None, max_length=30)
    observacoes: str | None = Field(default=None, max_length=1000)
    escritorio_id: int | None = None


class AdvogadoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    oab: str | None
    email: str | None
    telefone: str | None
    observacoes: str | None
    escritorio: EscritorioOut | None
