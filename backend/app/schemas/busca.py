from pydantic import BaseModel


class ResultadoBusca(BaseModel):
    tipo: str
    id: int
    titulo: str
    subtitulo: str | None
    url: str
