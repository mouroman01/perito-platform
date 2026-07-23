"""Pesquisa semantica (RF015) - indice de embeddings (Gemini text-embedding-004)

Sem pgvector: o vetor e serializado em JSON (Text) e o cosseno e calculado em Python.

Revision ID: 0011
Revises: 0010
Create Date: 2026-07-23

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0011"
down_revision: Union[str, None] = "0010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "embeddings_busca",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("tipo_entidade", sa.String(length=20), nullable=False),
        sa.Column("entidade_id", sa.Integer(), nullable=False),
        sa.Column("processo_id", sa.Integer(), nullable=True),
        sa.Column("titulo", sa.String(length=255), nullable=False),
        sa.Column("texto", sa.Text(), nullable=False),
        sa.Column("embedding", sa.Text(), nullable=False),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_embeddings_busca_tipo", "embeddings_busca", ["tipo_entidade"])


def downgrade() -> None:
    op.drop_index("ix_embeddings_busca_tipo", table_name="embeddings_busca")
    op.drop_table("embeddings_busca")
