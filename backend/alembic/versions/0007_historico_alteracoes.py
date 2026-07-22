"""Historico de alteracoes campo a campo (RF019)

Revision ID: 0007
Revises: 0006
Create Date: 2026-07-16

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "historico_alteracoes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("entidade", sa.String(length=50), nullable=False),
        sa.Column("entidade_id", sa.Integer(), nullable=False),
        sa.Column("campo", sa.String(length=100), nullable=False),
        sa.Column("valor_anterior", sa.Text(), nullable=True),
        sa.Column("valor_novo", sa.Text(), nullable=True),
        sa.Column("usuario_id", sa.Integer(), sa.ForeignKey("usuarios.id"), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(
        "ix_historico_alteracoes_entidade",
        "historico_alteracoes",
        ["entidade", "entidade_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_historico_alteracoes_entidade", table_name="historico_alteracoes")
    op.drop_table("historico_alteracoes")
