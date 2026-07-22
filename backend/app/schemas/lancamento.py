from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, computed_field

from app.models.lancamento import TipoImposto, TipoLancamento

StatusLancamento = Literal["pendente", "pago", "atrasado"]


class LancamentoBase(BaseModel):
    tipo: TipoLancamento
    descricao: str = Field(min_length=2, max_length=255)
    valor: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    vencimento: date
    observacoes: str | None = None
    processo_id: int | None = None
    tipo_imposto: TipoImposto | None = None
    competencia: date | None = None


class LancamentoCreate(LancamentoBase):
    pass


class LancamentoUpdate(BaseModel):
    tipo: TipoLancamento | None = None
    descricao: str | None = Field(default=None, min_length=2, max_length=255)
    valor: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    vencimento: date | None = None
    pago_em: date | None = None
    observacoes: str | None = None
    processo_id: int | None = None
    tipo_imposto: TipoImposto | None = None
    competencia: date | None = None


class ProcessoResumoFinanceiro(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    numero: str


class LancamentoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tipo: TipoLancamento
    descricao: str
    valor: Decimal
    vencimento: date
    pago_em: date | None
    observacoes: str | None
    processo: ProcessoResumoFinanceiro | None
    tipo_imposto: TipoImposto | None
    competencia: date | None

    @computed_field
    @property
    def status(self) -> StatusLancamento:
        if self.pago_em is not None:
            return "pago"
        if self.vencimento < date.today():
            return "atrasado"
        return "pendente"
