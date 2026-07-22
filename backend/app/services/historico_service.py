from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.historico_alteracao import HistoricoAlteracao

# Mapeia o nome da tabela (entidade) para a permissão de leitura equivalente,
# usada para autorizar a consulta ao histórico daquele tipo de registro.
PERMISSAO_POR_ENTIDADE: dict[str, str] = {
    "usuarios": "usuarios:read",
    "comarcas": "crm:read",
    "magistrados": "crm:read",
    "escritorios": "crm:read",
    "advogados": "crm:read",
    "contatos": "crm:read",
    "clientes": "crm:read",
    "prospeccoes": "crm:read",
    "processos": "processos:read",
    "compromissos": "agenda:read",
    "lancamentos_financeiros": "financeiro:read",
    "modelos": "biblioteca:read",
    "laudos": "laudos:read",
}


def listar(db: Session, entidade: str, entidade_id: int, limite: int = 100) -> list[HistoricoAlteracao]:
    return list(
        db.scalars(
            select(HistoricoAlteracao)
            .options(joinedload(HistoricoAlteracao.usuario))
            .where(
                HistoricoAlteracao.entidade == entidade,
                HistoricoAlteracao.entidade_id == entidade_id,
            )
            .order_by(HistoricoAlteracao.criado_em.desc())
            .limit(limite)
        )
    )
