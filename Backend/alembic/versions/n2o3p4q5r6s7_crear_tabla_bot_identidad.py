"""crear tabla bot_identidad

Revision ID: n2o3p4q5r6s7
Revises: m1n2o3p4q5r6
Create Date: 2026-05-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'n2o3p4q5r6s7'
down_revision = 'm1n2o3p4q5r6'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'bot_identidad',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('nombre', sa.String(), nullable=False, server_default='Infobot'),
        sa.Column('sexo', sa.String(), nullable=False, server_default='neutro'),
        sa.Column('personalidad', sa.Text(), nullable=True),
        sa.Column('tono', sa.String(), nullable=False, server_default='formal'),
        sa.Column('idioma', sa.String(), nullable=False, server_default='español'),
        sa.Column('institucion', sa.String(), nullable=True),
        sa.Column('descripcion', sa.Text(), nullable=True),
        sa.Column('restricciones', sa.Text(), nullable=True),
        sa.Column('imagen_url', sa.Text(), nullable=True),
        sa.Column('actualizado_en', sa.DateTime(), nullable=False),
    )


def downgrade():
    op.drop_table('bot_identidad')
