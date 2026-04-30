"""crear tabla urls_oficiales

Revision ID: i9j0k1l2m3n4
Revises: h8i9j0k1l2m3
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'i9j0k1l2m3n4'
down_revision = 'h8i9j0k1l2m3'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'urls_oficiales',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('url', sa.String(), unique=True, nullable=False),
        sa.Column('descripcion', sa.String(), nullable=True),
        sa.Column('activa', sa.Boolean(), default=True),
        sa.Column('creado_en', sa.DateTime(), nullable=False),
    )


def downgrade():
    op.drop_table('urls_oficiales')
