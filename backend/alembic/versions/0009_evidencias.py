"""Modulo de Evidencias (RF008) - distinto de Documentos, com hash de integridade

Revision ID: 0009
Revises: 0008
Create Date: 2026-07-17

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0009"
down_revision: Union[str, None] = "0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "evidencias",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nome_original", sa.String(length=255), nullable=False),
        sa.Column("nome_armazenado", sa.String(length=255), nullable=False),
        sa.Column("tipo", sa.String(length=20), nullable=False),
        sa.Column("midia_origem", sa.String(length=20), nullable=True),
        sa.Column("descricao", sa.Text(), nullable=True),
        sa.Column("hash_sha256", sa.String(length=64), nullable=False),
        sa.Column("tamanho_bytes", sa.BigInteger(), nullable=False),
        sa.Column("content_type", sa.String(length=150), nullable=True),
        sa.Column("processo_id", sa.Integer(), sa.ForeignKey("processos.id"), nullable=False),
        sa.Column("responsavel_id", sa.Integer(), sa.ForeignKey("usuarios.id"), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("evidencias")
