"""Captura automática de histórico de alterações campo a campo.

Registra um listener `before_flush` do SQLAlchemy que, a cada commit, inspeciona
os objetos modificados (session.dirty) e grava uma linha em HistoricoAlteracao
para cada campo que mudou de valor. Funciona para qualquer modelo na lista
MODELOS_RASTREADOS sem precisar instrumentar cada service manualmente.
"""

import enum

from sqlalchemy import event, inspect
from sqlalchemy.orm import Session
from sqlalchemy.orm.base import NO_VALUE

from app.models.advogado import Advogado
from app.models.cliente import Cliente
from app.models.comarca import Comarca
from app.models.compromisso import Compromisso
from app.models.contato import Contato
from app.models.escritorio import Escritorio
from app.models.historico_alteracao import HistoricoAlteracao
from app.models.lancamento import Lancamento
from app.models.laudo import Laudo
from app.models.magistrado import Magistrado
from app.models.modelo import Modelo
from app.models.processo import Processo
from app.models.prospeccao import Prospeccao
from app.models.usuario import Usuario

MODELOS_RASTREADOS = (
    Usuario,
    Comarca,
    Magistrado,
    Escritorio,
    Advogado,
    Contato,
    Cliente,
    Prospeccao,
    Processo,
    Compromisso,
    Lancamento,
    Modelo,
    Laudo,
)

CAMPOS_IGNORADOS_GLOBAL = {"criado_em", "atualizado_em", "senha_hash"}
CAMPOS_IGNORADOS_POR_MODELO: dict[type, set[str]] = {
    Laudo: {"conteudo"},
}


def _serializar(valor) -> str | None:
    if valor is None:
        return None
    if isinstance(valor, enum.Enum):
        return valor.value
    return str(valor)


@event.listens_for(Session, "before_flush")
def _capturar_historico(session: Session, flush_context, instances) -> None:
    usuario_id = session.info.get("usuario_id")

    for obj in list(session.dirty):
        if not isinstance(obj, MODELOS_RASTREADOS):
            continue
        if not session.is_modified(obj, include_collections=False):
            continue

        ignorados = CAMPOS_IGNORADOS_GLOBAL | CAMPOS_IGNORADOS_POR_MODELO.get(type(obj), set())
        estado = inspect(obj)
        colunas = inspect(type(obj)).column_attrs

        for coluna in colunas:
            chave = coluna.key
            if chave in ignorados:
                continue

            historico = estado.attrs[chave].history
            if not historico.has_changes():
                continue

            valor_anterior = historico.deleted[0] if historico.deleted else None
            valor_novo = historico.added[0] if historico.added else None
            if valor_anterior is NO_VALUE:
                valor_anterior = None
            if valor_anterior == valor_novo:
                continue

            session.add(
                HistoricoAlteracao(
                    entidade=obj.__tablename__,
                    entidade_id=obj.id,
                    campo=chave,
                    valor_anterior=_serializar(valor_anterior),
                    valor_novo=_serializar(valor_novo),
                    usuario_id=usuario_id,
                )
            )
