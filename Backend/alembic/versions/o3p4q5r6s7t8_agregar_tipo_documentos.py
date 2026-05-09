"""agregar campo tipo a documentos

Revision ID: o3p4q5r6s7t8
Revises: n2o3p4q5r6s7
Create Date: 2026-05-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'o3p4q5r6s7t8'
down_revision = 'n2o3p4q5r6s7'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('documentos', sa.Column('tipo', sa.String(), nullable=False, server_default='publico'))


def downgrade():
    op.drop_column('documentos', 'tipo')
