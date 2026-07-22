from pydantic import BaseModel, ConfigDict, Field


class ComarcaBase(BaseModel):
    nome: str = Field(min_length=2, max_length=150)
    uf: str = Field(min_length=2, max_length=2)
    tribunal: str | None = Field(default=None, max_length=50)


class ComarcaCreate(ComarcaBase):
    pass


class ComarcaUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=2, max_length=150)
    uf: str | None = Field(default=None, min_length=2, max_length=2)
    tribunal: str | None = Field(default=None, max_length=50)


class ComarcaOut(ComarcaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
