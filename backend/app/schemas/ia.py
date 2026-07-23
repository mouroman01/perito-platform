from pydantic import BaseModel, Field, model_validator


class ResumirRequest(BaseModel):
    texto: str = Field(min_length=20, max_length=100_000)


class ResumoResponse(BaseModel):
    resumo: str


class EstruturaLaudoRequest(BaseModel):
    processo_id: int | None = None
    contexto: str | None = Field(default=None, max_length=10_000)

    @model_validator(mode="after")
    def _exige_processo_ou_contexto(self):
        if self.processo_id is None and not (self.contexto and self.contexto.strip()):
            raise ValueError("Informe processo_id ou contexto.")
        return self


class EstruturaResponse(BaseModel):
    estrutura: str
