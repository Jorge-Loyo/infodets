"""crear tabla validaciones_respuesta

Revision ID: h8i9j0k1l2m3
Revises: g7h8i9j0k1l2
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'h8i9j0k1l2m3'
down_revision = 'g7h8i9j0k1l2'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'validaciones_respuesta',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('pregunta', sa.Text(), nullable=False),
        sa.Column('respuesta', sa.Text(), nullable=False),
        sa.Column('puntaje_confianza', sa.Float(), default=0.0),
        sa.Column('fuente', sa.String(), default='usuario'),
        sa.Column('estado', sa.String(), default='pendiente'),
        sa.Column('creado_en', sa.DateTime(), nullable=False),
    )


def downgrade():
    op.drop_table('validaciones_respuesta')
