"""crear tabla cache_respuestas

Revision ID: r6s7t8u9v0w1
Revises: q5r6s7t8u9v0
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY, FLOAT

revision = 'r6s7t8u9v0w1'
down_revision = 'q5r6s7t8u9v0'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'cache_respuestas',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('pregunta', sa.Text, nullable=False),
        sa.Column('embedding', ARRAY(FLOAT), nullable=False),
        sa.Column('respuesta', sa.Text, nullable=False),
        sa.Column('tipo_respuesta', sa.String, nullable=False, server_default='local'),
        sa.Column('nivel', sa.Integer, nullable=False, server_default='0'),
        sa.Column('hits', sa.Integer, nullable=False, server_default='0'),
        sa.Column('creado_en', sa.DateTime, nullable=False),
        sa.Column('expira_en', sa.DateTime, nullable=False),
    )


def downgrade():
    op.drop_table('cache_respuestas')
