"""crear_tabla_conversaciones

Revision ID: j0k1l2m3n4o5
Revises: i9j0k1l2m3n4
Create Date: 2026-04-30 18:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'j0k1l2m3n4o5'
down_revision: Union[str, Sequence[str], None] = 'i9j0k1l2m3n4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'conversaciones',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('usuario_id', sa.UUID(), nullable=False),
        sa.Column('titulo', sa.String(), nullable=False),
        sa.Column('creado_en', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.add_column('historial_chat', sa.Column('conversacion_id', sa.UUID(), nullable=True))
    op.create_foreign_key('fk_historial_conversacion', 'historial_chat', 'conversaciones', ['conversacion_id'], ['id'], ondelete='CASCADE')


def downgrade() -> None:
    op.drop_constraint('fk_historial_conversacion', 'historial_chat', type_='foreignkey')
    op.drop_column('historial_chat', 'conversacion_id')
    op.drop_table('conversaciones')
