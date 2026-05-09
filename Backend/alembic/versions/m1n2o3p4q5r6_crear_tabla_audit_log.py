"""crear tabla audit_log

Revision ID: m1n2o3p4q5r6
Revises: l2m3n4o5p6q7
Create Date: 2026-05-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'm1n2o3p4q5r6'
down_revision = 'l2m3n4o5p6q7'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'audit_log',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('accion', sa.String(), nullable=False),
        sa.Column('entidad', sa.String(), nullable=False),
        sa.Column('entidad_id', sa.String(), nullable=True),
        sa.Column('entidad_nombre', sa.String(), nullable=True),
        sa.Column('detalle', sa.Text(), nullable=True),
        sa.Column('realizado_por_id', sa.String(), nullable=True),
        sa.Column('realizado_por_email', sa.String(), nullable=True),
        sa.Column('creado_en', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_audit_log_creado_en', 'audit_log', ['creado_en'])
    op.create_index('ix_audit_log_accion', 'audit_log', ['accion'])


def downgrade():
    op.drop_index('ix_audit_log_accion', 'audit_log')
    op.drop_index('ix_audit_log_creado_en', 'audit_log')
    op.drop_table('audit_log')
