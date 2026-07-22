"""CRM: comarcas, magistrados, clientes, prospeccoes

Revision ID: 0002
Revises: 0001
Create Date: 2026-07-15

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "comarcas",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nome", sa.String(length=150), nullable=False),
        sa.Column("uf", sa.String(length=2), nullable=False),
        sa.Column("tribunal", sa.String(length=50), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column(
            "atualizado_em",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    op.create_table(
        "magistrados",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nome", sa.String(length=150), nullable=False),
        sa.Column("cargo", sa.String(length=50), nullable=True),
        sa.Column("vara", sa.String(length=100), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("telefone", sa.String(length=30), nullable=True),
        sa.Column("observacoes", sa.String(length=1000), nullable=True),
        sa.Column("comarca_id", sa.Integer(), sa.ForeignKey("comarcas.id"), nullable=False),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column(
            "atualizado_em",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    op.create_table(
        "clientes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nome", sa.String(length=150), nullable=False),
        sa.Column("tipo", sa.String(length=20), nullable=False),
        sa.Column("documento", sa.String(length=20), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("telefone", sa.String(length=30), nullable=True),
        sa.Column("observacoes", sa.String(length=1000), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column(
            "atualizado_em",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    op.create_table(
        "prospeccoes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nome", sa.String(length=150), nullable=False),
        sa.Column("estagio", sa.String(length=20), nullable=False, server_default="prospeccao"),
        sa.Column("origem", sa.String(length=100), nullable=True),
        sa.Column("contato", sa.String(length=255), nullable=True),
        sa.Column("observacoes", sa.String(length=1000), nullable=True),
        sa.Column("cliente_id", sa.Integer(), sa.ForeignKey("clientes.id"), nullable=True),
        sa.Column("responsavel_id", sa.Integer(), sa.ForeignKey("usuarios.id"), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column(
            "atualizado_em",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("prospeccoes")
    op.drop_table("clientes")
    op.drop_table("magistrados")
    op.drop_table("comarcas")
