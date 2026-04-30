"""crear tabla consultas_invitado

Revision ID: g7h8i9j0k1l2
Revises: f6a1b2c3d4e5
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'g7h8i9j0k1l2'
down_revision = 'a2b3c4d5e6f7'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'consultas_invitado',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('nombre', sa.String(), nullable=False),
        sa.Column('apellido', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('institucion', sa.String(), nullable=True),
        sa.Column('pregunta', sa.Text(), nullable=False),
        sa.Column('respuesta', sa.Text(), nullable=False),
        sa.Column('puntaje_confianza', sa.Float(), default=0.0),
        sa.Column('creado_en', sa.DateTime(), nullable=False),
    )


def downgrade():
    op.drop_table('consultas_invitado')
