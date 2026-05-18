"""crear tabla configuracion_sistema

Revision ID: q5r6s7t8u9v0
Revises: p4q5r6s7t8u9
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'q5r6s7t8u9v0'
down_revision = 'p4q5r6s7t8u9'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'configuracion_sistema',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('logo_url', sa.String, nullable=True),
        sa.Column('actualizado_en', sa.DateTime, nullable=False),
    )


def downgrade():
    op.drop_table('configuracion_sistema')
