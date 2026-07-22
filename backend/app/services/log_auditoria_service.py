from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.log_auditoria import LogAuditoria

LIMITE_PADRAO = 200


def listar(db: Session, limite: int = LIMITE_PADRAO) -> list[LogAuditoria]:
    return list(
        db.scalars(
            select(LogAuditoria)
            .options(joinedload(LogAuditoria.usuario))
            .order_by(LogAuditoria.criado_em.desc())
            .limit(limite)
        )
    )
