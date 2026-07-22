"""DARF/Impostos no Financeiro: tipo_imposto e competencia em lancamentos

Revision ID: 0010
Revises: 0009
Create Date: 2026-07-18

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0010"
down_revision: Union[str, None] = "0009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "lancamentos_financeiros", sa.Column("tipo_imposto", sa.String(length=20), nullable=True)
    )
    op.add_column("lancamentos_financeiros", sa.Column("competencia", sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column("lancamentos_financeiros", "competencia")
    op.drop_column("lancamentos_financeiros", "tipo_imposto")
