from pydantic import BaseModel, ConfigDict, Field

from app.models.modelo import CategoriaModelo


class ModeloBase(BaseModel):
    nome: str = Field(min_length=2, max_length=150)
    categoria: CategoriaModelo
    conteudo: str = Field(min_length=1)
    descricao: str | None = Field(default=None, max_length=500)


class ModeloCreate(ModeloBase):
    pass


class ModeloUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=2, max_length=150)
    categoria: CategoriaModelo | None = None
    conteudo: str | None = Field(default=None, min_length=1)
    descricao: str | None = Field(default=None, max_length=500)


class ModeloOut(ModeloBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
