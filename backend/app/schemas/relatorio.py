from pydantic import BaseModel


class ContagemPorCategoria(BaseModel):
    categoria: str
    total: int


class FinanceiroMensal(BaseModel):
    mes: str
    entradas: float
    saidas: float


class IndicadoresOut(BaseModel):
    processos_por_situacao: list[ContagemPorCategoria]
    laudos_por_status: list[ContagemPorCategoria]
    financeiro_mensal: list[FinanceiroMensal]
