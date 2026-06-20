"""add password_hash to usuarios

Revision ID: t8u9v0w1x2y3
Revises: s7t8u9v0w1x2
Create Date: 2026-06-20
"""
from alembic import op
import sqlalchemy as sa

revision = 't8u9v0w1x2y3'
down_revision = '9b73f01a0cc7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('usuarios', sa.Column('password_hash', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('usuarios', 'password_hash')
