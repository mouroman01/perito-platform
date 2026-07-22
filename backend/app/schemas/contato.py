from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ContatoBase(BaseModel):
    nome: str = Field(min_length=2, max_length=150)
    cargo: str | None = Field(default=None, max_length=100)
    organizacao: str | None = Field(default=None, max_length=150)
    email: EmailStr | None = None
    telefone: str | None = Field(default=None, max_length=30)
    observacoes: str | None = Field(default=None, max_length=1000)


class ContatoCreate(ContatoBase):
    pass


class ContatoUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=2, max_length=150)
    cargo: str | None = Field(default=None, max_length=100)
    organizacao: str | None = Field(default=None, max_length=150)
    email: EmailStr | None = None
    telefone: str | None = Field(default=None, max_length=30)
    observacoes: str | None = Field(default=None, max_length=1000)


class ContatoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    cargo: str | None
    organizacao: str | None
    email: str | None
    telefone: str | None
    observacoes: str | None
