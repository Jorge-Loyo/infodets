"""crear tabla tickets_vacios

Revision ID: a2b3c4d5e6f7
Revises: f6a1b2c3d4e5
Create Date: 2026-04-29 04:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'a2b3c4d5e6f7'
down_revision: Union[str, Sequence[str], None] = 'f6a1b2c3d4e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'tickets_vacios',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('pregunta', sa.Text(), nullable=False),
        sa.Column('usuario_id', sa.String(), nullable=True),
        sa.Column('puntaje_confianza', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('estado', sa.String(), nullable=False, server_default='pendiente'),
        sa.Column('creado_en', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('tickets_vacios')
