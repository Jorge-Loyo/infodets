"""agregar_mensajes_ticket

Revision ID: l2m3n4o5p6q7
Revises: k1l2m3n4o5p6
Create Date: 2026-04-30 20:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'l2m3n4o5p6q7'
down_revision: Union[str, Sequence[str], None] = 'k1l2m3n4o5p6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('tickets_vacios', sa.Column('nivel', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('tickets_vacios', sa.Column('requiere_respuesta', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('tickets_vacios', sa.Column('mensajes_no_leidos', sa.Integer(), nullable=False, server_default='0'))
    op.create_table(
        'mensajes_ticket',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('ticket_id', sa.UUID(), nullable=False),
        sa.Column('autor_id', sa.UUID(), nullable=True),
        sa.Column('rol', sa.String(), nullable=False),  # 'admin' | 'usuario'
        sa.Column('texto', sa.Text(), nullable=False),
        sa.Column('leido', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('creado_en', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['ticket_id'], ['tickets_vacios.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['autor_id'], ['usuarios.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('mensajes_ticket')
    op.drop_column('tickets_vacios', 'mensajes_no_leidos')
    op.drop_column('tickets_vacios', 'requiere_respuesta')
    op.drop_column('tickets_vacios', 'nivel')
