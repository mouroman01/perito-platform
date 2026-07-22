from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.perfil import PerfilOut


class UsuarioBase(BaseModel):
    nome: str = Field(min_length=2, max_length=150)
    email: EmailStr
    perfil_id: int


class UsuarioCreate(UsuarioBase):
    senha: str = Field(min_length=8, max_length=128)


class UsuarioUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=2, max_length=150)
    perfil_id: int | None = None
    ativo: bool | None = None
    senha: str | None = Field(default=None, min_length=8, max_length=128)


class UsuarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    email: EmailStr
    ativo: bool
    perfil: PerfilOut
    ultimo_login_em: datetime | None
    criado_em: datetime
