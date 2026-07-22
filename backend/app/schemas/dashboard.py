from pydantic import BaseModel


class DashboardKPIs(BaseModel):
    processos_ativos: int = 0
    nomeacoes_pendentes: int = 0
    laudos_em_andamento: int = 0
    honorarios_a_receber: float = 0.0
    prazos_proximos_7_dias: int = 0
    usuarios_ativos: int = 0
