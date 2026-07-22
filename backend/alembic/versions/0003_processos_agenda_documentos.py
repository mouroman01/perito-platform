"""Fase 3: processos, compromissos (agenda), documentos

Revision ID: 0003
Revises: 0002
Create Date: 2026-07-15

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "processos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("numero", sa.String(length=50), nullable=False, unique=True),
        sa.Column("partes", sa.Text(), nullable=True),
        sa.Column("objeto", sa.Text(), nullable=True),
        sa.Column("especialidade", sa.String(length=100), nullable=True),
        sa.Column("prazo", sa.Date(), nullable=True),
        sa.Column("situacao", sa.String(length=20), nullable=False, server_default="aceite"),
        sa.Column("observacoes", sa.Text(), nullable=True),
        sa.Column("comarca_id", sa.Integer(), sa.ForeignKey("comarcas.id"), nullable=False),
        sa.Column("magistrado_id", sa.Integer(), sa.ForeignKey("magistrados.id"), nullable=True),
        sa.Column("cliente_id", sa.Integer(), sa.ForeignKey("clientes.id"), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column(
            "atualizado_em",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    op.create_table(
        "compromissos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("titulo", sa.String(length=150), nullable=False),
        sa.Column("tipo", sa.String(length=20), nullable=False),
        sa.Column("data_hora", sa.DateTime(timezone=True), nullable=False),
        sa.Column("local", sa.String(length=255), nullable=True),
        sa.Column("concluido", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("observacoes", sa.Text(), nullable=True),
        sa.Column("processo_id", sa.Integer(), sa.ForeignKey("processos.id"), nullable=True),
        sa.Column("responsavel_id", sa.Integer(), sa.ForeignKey("usuarios.id"), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column(
            "atualizado_em",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    op.create_table(
        "documentos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nome_original", sa.String(length=255), nullable=False),
        sa.Column("nome_armazenado", sa.String(length=255), nullable=False),
        sa.Column("categoria", sa.String(length=100), nullable=True),
        sa.Column("tamanho_bytes", sa.BigInteger(), nullable=False),
        sa.Column("content_type", sa.String(length=150), nullable=True),
        sa.Column("processo_id", sa.Integer(), sa.ForeignKey("processos.id"), nullable=False),
        sa.Column("enviado_por_id", sa.Integer(), sa.ForeignKey("usuarios.id"), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("documentos")
    op.drop_table("compromissos")
    op.drop_table("processos")
