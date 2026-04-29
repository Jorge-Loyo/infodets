"""agregar campos perfil usuario

Revision ID: a1b2c3d4e5f6
Revises: 6673e904a003
Create Date: 2026-04-28 22:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '6673e904a003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('usuarios', sa.Column('apellido', sa.String(), nullable=True))
    op.add_column('usuarios', sa.Column('dni', sa.String(), nullable=True))
    op.add_column('usuarios', sa.Column('fecha_nacimiento', sa.String(), nullable=True))
    op.add_column('usuarios', sa.Column('cargo', sa.String(), nullable=True))
    op.add_column('usuarios', sa.Column('institucion', sa.String(), nullable=True))
    op.add_column('usuarios', sa.Column('dependencia', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('usuarios', 'dependencia')
    op.drop_column('usuarios', 'institucion')
    op.drop_column('usuarios', 'cargo')
    op.drop_column('usuarios', 'fecha_nacimiento')
    op.drop_column('usuarios', 'dni')
    op.drop_column('usuarios', 'apellido')
