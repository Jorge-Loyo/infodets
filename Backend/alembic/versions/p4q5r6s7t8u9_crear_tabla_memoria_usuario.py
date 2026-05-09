"""crear tabla memoria_usuario

Revision ID: p4q5r6s7t8u9
Revises: o3p4q5r6s7t8
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'p4q5r6s7t8u9'
down_revision = 'o3p4q5r6s7t8'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'memoria_usuario',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('usuario_id', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('nombre', sa.String, nullable=True),
        sa.Column('resumen', sa.Text, nullable=True),
        sa.Column('total_consultas', sa.Integer, default=0),
        sa.Column('actualizado_en', sa.DateTime, nullable=False),
    )


def downgrade():
    op.drop_table('memoria_usuario')
