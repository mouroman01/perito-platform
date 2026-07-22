from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.lancamento import Lancamento
from app.models.laudo import Laudo
from app.models.processo import Processo
from app.schemas.relatorio import ContagemPorCategoria, FinanceiroMensal, IndicadoresOut


def _somar_meses(referencia: date, meses: int) -> date:
    indice = referencia.month - 1 + meses
    ano = referencia.year + indice // 12
    mes = indice % 12 + 1
    return date(ano, mes, 1)


def _processos_por_situacao(db: Session) -> list[ContagemPorCategoria]:
    linhas = db.execute(
        select(Processo.situacao, func.count()).group_by(Processo.situacao)
    ).all()
    return [ContagemPorCategoria(categoria=situacao.value, total=total) for situacao, total in linhas]


def _laudos_por_status(db: Session) -> list[ContagemPorCategoria]:
    linhas = db.execute(select(Laudo.status, func.count()).group_by(Laudo.status)).all()
    return [ContagemPorCategoria(categoria=status.value, total=total) for status, total in linhas]


def _financeiro_mensal(db: Session, meses_passados: int = 3, meses_futuros: int = 2) -> list[FinanceiroMensal]:
    hoje = date.today()
    inicio = _somar_meses(hoje.replace(day=1), -meses_passados)
    total_meses = meses_passados + meses_futuros + 1

    mes_expr = func.to_char(Lancamento.vencimento, "YYYY-MM")
    linhas = db.execute(
        select(mes_expr, Lancamento.tipo, func.coalesce(func.sum(Lancamento.valor), 0))
        .where(Lancamento.vencimento >= inicio)
        .group_by(mes_expr, Lancamento.tipo)
    ).all()

    totais: dict[str, dict[str, float]] = {}
    for mes, tipo, total in linhas:
        totais.setdefault(mes, {"entrada": 0.0, "saida": 0.0})
        totais[mes][tipo.value] = float(total)

    resultado = []
    for i in range(total_meses):
        referencia = _somar_meses(inicio, i)
        chave = referencia.strftime("%Y-%m")
        valores = totais.get(chave, {"entrada": 0.0, "saida": 0.0})
        resultado.append(
            FinanceiroMensal(mes=chave, entradas=valores.get("entrada", 0.0), saidas=valores.get("saida", 0.0))
        )
    return resultado


def obter_indicadores(db: Session) -> IndicadoresOut:
    return IndicadoresOut(
        processos_por_situacao=_processos_por_situacao(db),
        laudos_por_status=_laudos_por_status(db),
        financeiro_mensal=_financeiro_mensal(db),
    )
