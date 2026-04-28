"""crear tabla noticias

Revision ID: f6a1b2c3d4e5
Revises: e5f6a1b2c3d4
Create Date: 2026-04-29 03:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'f6a1b2c3d4e5'
down_revision: Union[str, Sequence[str], None] = 'e5f6a1b2c3d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'noticias',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('titulo', sa.String(), nullable=False),
        sa.Column('contenido', sa.Text(), nullable=False),
        sa.Column('categoria', sa.String(), nullable=True),
        sa.Column('imagen_url', sa.String(), nullable=True),
        sa.Column('autor_nombre', sa.String(), nullable=True),
        sa.Column('autor_cargo', sa.String(), nullable=True),
        sa.Column('publicada', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('likes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('creado_en', sa.DateTime(), nullable=False),
        sa.Column('actualizado_en', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('noticias')
