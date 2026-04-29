"""crear tablas perfiles y perfil_permisos

Revision ID: c3d4e5f6a1b2
Revises: b2c3d4e5f6a1
Create Date: 2026-04-29 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'c3d4e5f6a1b2'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'perfiles',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('nombre', sa.String(), nullable=False),
        sa.Column('descripcion', sa.String(), nullable=True),
        sa.Column('color', sa.String(), nullable=False, server_default='blue'),
        sa.Column('creado_en', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('nombre'),
    )
    op.create_table(
        'perfil_permisos',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('perfil_id', sa.UUID(), nullable=False),
        sa.Column('seccion', sa.String(), nullable=False),
        sa.Column('habilitado', sa.Boolean(), nullable=False, server_default='true'),
        sa.ForeignKeyConstraint(['perfil_id'], ['perfiles.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('perfil_id', 'seccion', name='uq_perfil_seccion'),
    )
    op.add_column('usuarios', sa.Column('perfil_id', sa.UUID(), nullable=True))
    op.create_foreign_key('fk_usuario_perfil', 'usuarios', 'perfiles', ['perfil_id'], ['id'])


def downgrade() -> None:
    op.drop_constraint('fk_usuario_perfil', 'usuarios', type_='foreignkey')
    op.drop_column('usuarios', 'perfil_id')
    op.drop_table('perfil_permisos')
    op.drop_table('perfiles')
