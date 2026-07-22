from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.lancamento import Lancamento, TipoLancamento
from app.models.processo import Processo, SituacaoProcesso
from app.models.prospeccao import EstagioProspeccao, Prospeccao
from app.models.usuario import Usuario
from app.schemas.dashboard import DashboardKPIs

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardKPIs)
def obter_kpis(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    usuarios_ativos = db.scalar(select(func.count()).select_from(Usuario).where(Usuario.ativo.is_(True))) or 0

    processos_ativos = (
        db.scalar(
            select(func.count())
            .select_from(Processo)
            .where(Processo.situacao != SituacaoProcesso.ARQUIVADO)
        )
        or 0
    )

    nomeacoes_pendentes = (
        db.scalar(
            select(func.count())
            .select_from(Prospeccao)
            .where(Prospeccao.estagio == EstagioProspeccao.NOMEACAO)
        )
        or 0
    )

    laudos_em_andamento = (
        db.scalar(
            select(func.count()).select_from(Processo).where(Processo.situacao == SituacaoProcesso.LAUDO)
        )
        or 0
    )

    honorarios_a_receber = (
        db.scalar(
            select(func.coalesce(func.sum(Lancamento.valor), 0)).where(
                Lancamento.tipo == TipoLancamento.ENTRADA,
                Lancamento.pago_em.is_(None),
            )
        )
        or 0
    )

    hoje = date.today()
    prazos_proximos_7_dias = (
        db.scalar(
            select(func.count())
            .select_from(Processo)
            .where(Processo.prazo.is_not(None), Processo.prazo.between(hoje, hoje + timedelta(days=7)))
        )
        or 0
    )

    return DashboardKPIs(
        processos_ativos=processos_ativos,
        nomeacoes_pendentes=nomeacoes_pendentes,
        laudos_em_andamento=laudos_em_andamento,
        honorarios_a_receber=float(honorarios_a_receber),
        prazos_proximos_7_dias=prazos_proximos_7_dias,
        usuarios_ativos=usuarios_ativos,
    )
