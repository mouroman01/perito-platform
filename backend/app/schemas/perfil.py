from pydantic import BaseModel, ConfigDict


class PerfilBase(BaseModel):
    nome: str
    descricao: str | None = None
    permissoes: list[str] = []


class PerfilCreate(PerfilBase):
    pass


class PerfilOut(PerfilBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
