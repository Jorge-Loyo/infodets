"""crear tabla permisos_usuario

Revision ID: b2c3d4e5f6a1
Revises: a1b2c3d4e5f6
Create Date: 2026-04-28 23:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'b2c3d4e5f6a1'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'permisos_usuario',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('usuario_id', sa.UUID(), nullable=False),
        sa.Column('seccion', sa.String(), nullable=False),
        sa.Column('habilitado', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('actualizado_en', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('usuario_id', 'seccion', name='uq_permiso_usuario_seccion'),
    )


def downgrade() -> None:
    op.drop_table('permisos_usuario')
