"""Fase 8: logs de auditoria

Revision ID: 0006
Revises: 0005
Create Date: 2026-07-16

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "logs_auditoria",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("metodo", sa.String(length=10), nullable=False),
        sa.Column("caminho", sa.String(length=255), nullable=False),
        sa.Column("status_code", sa.Integer(), nullable=False),
        sa.Column("ip", sa.String(length=45), nullable=True),
        sa.Column("usuario_id", sa.Integer(), sa.ForeignKey("usuarios.id"), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_logs_auditoria_criado_em", "logs_auditoria", ["criado_em"])


def downgrade() -> None:
    op.drop_index("ix_logs_auditoria_criado_em", table_name="logs_auditoria")
    op.drop_table("logs_auditoria")
