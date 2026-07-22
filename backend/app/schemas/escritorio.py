from pydantic import BaseModel, ConfigDict, EmailStr, Field


class EscritorioBase(BaseModel):
    nome: str = Field(min_length=2, max_length=150)
    cnpj: str | None = Field(default=None, max_length=20)
    email: EmailStr | None = None
    telefone: str | None = Field(default=None, max_length=30)
    cidade: str | None = Field(default=None, max_length=100)
    uf: str | None = Field(default=None, min_length=2, max_length=2)
    observacoes: str | None = Field(default=None, max_length=1000)


class EscritorioCreate(EscritorioBase):
    pass


class EscritorioUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=2, max_length=150)
    cnpj: str | None = Field(default=None, max_length=20)
    email: EmailStr | None = None
    telefone: str | None = Field(default=None, max_length=30)
    cidade: str | None = Field(default=None, max_length=100)
    uf: str | None = Field(default=None, min_length=2, max_length=2)
    observacoes: str | None = Field(default=None, max_length=1000)


class EscritorioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    cnpj: str | None
    email: str | None
    telefone: str | None
    cidade: str | None
    uf: str | None
    observacoes: str | None
