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


class ExtrairRequest(BaseModel):
    texto: str = Field(min_length=20, max_length=100_000)


class ExtracaoResponse(BaseModel):
    partes: list[str] = []
    valores: list[str] = []
    datas: list[str] = []
    documentos: list[str] = []
    quesitos: list[str] = []
    objeto: str = ""


class ChecklistRequest(BaseModel):
    processo_id: int | None = None
    contexto: str | None = Field(default=None, max_length=10_000)

    @model_validator(mode="after")
    def _exige_processo_ou_contexto(self):
        if self.processo_id is None and not (self.contexto and self.contexto.strip()):
            raise ValueError("Informe processo_id ou contexto.")
        return self


class ChecklistResponse(BaseModel):
    itens: list[str] = []


class OrganizarEvidenciasRequest(BaseModel):
    processo_id: int


class OrganizacaoEvidenciasResponse(BaseModel):
    organizacao: str


class BuscaInteligenteRequest(BaseModel):
    processo_id: int
    consulta: str = Field(min_length=3, max_length=2_000)


class BuscaInteligenteResponse(BaseModel):
    resposta: str


class ReindexarResponse(BaseModel):
    indexados: int


class PesquisaSemanticaRequest(BaseModel):
    consulta: str = Field(min_length=3, max_length=2_000)
    limite: int = Field(default=8, ge=1, le=30)


class ResultadoSemantico(BaseModel):
    tipo: str
    id: int
    processo_id: int | None = None
    titulo: str
    score: float
    snippet: str
    url: str


class PesquisaSemanticaResponse(BaseModel):
    resultados: list[ResultadoSemantico]
