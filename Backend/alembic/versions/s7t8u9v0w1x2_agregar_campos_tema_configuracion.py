"""agregar campos tema a configuracion_sistema

Revision ID: s7t8u9v0w1x2
Revises: r6s7t8u9v0w1
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 's7t8u9v0w1x2'
down_revision = 'r6s7t8u9v0w1'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('configuracion_sistema', sa.Column('header_color', sa.String, server_default='#ffffff', nullable=False))
    op.add_column('configuracion_sistema', sa.Column('paleta_color', sa.String, server_default='blue', nullable=False))
    op.add_column('configuracion_sistema', sa.Column('tipografia', sa.String, server_default='Plus Jakarta Sans', nullable=False))
    op.add_column('configuracion_sistema', sa.Column('logo_size', sa.Integer, server_default='32', nullable=False))
    op.add_column('configuracion_sistema', sa.Column('color_scheme', sa.String, server_default='light', nullable=False))
    op.add_column('configuracion_sistema', sa.Column('color_sidebar', sa.String, server_default='', nullable=False))
    op.add_column('configuracion_sistema', sa.Column('color_texto', sa.String, server_default='', nullable=False))
    op.add_column('configuracion_sistema', sa.Column('color_boton', sa.String, server_default='', nullable=False))
    op.add_column('configuracion_sistema', sa.Column('color_fondo', sa.String, server_default='', nullable=False))
    op.add_column('configuracion_sistema', sa.Column('color_tarjeta', sa.String, server_default='', nullable=False))
    op.add_column('configuracion_sistema', sa.Column('tema_activo', sa.String, server_default='Estándar', nullable=False))


def downgrade():
    op.drop_column('configuracion_sistema', 'tema_activo')
    op.drop_column('configuracion_sistema', 'color_tarjeta')
    op.drop_column('configuracion_sistema', 'color_fondo')
    op.drop_column('configuracion_sistema', 'color_boton')
    op.drop_column('configuracion_sistema', 'color_texto')
    op.drop_column('configuracion_sistema', 'color_sidebar')
    op.drop_column('configuracion_sistema', 'color_scheme')
    op.drop_column('configuracion_sistema', 'logo_size')
    op.drop_column('configuracion_sistema', 'tipografia')
    op.drop_column('configuracion_sistema', 'paleta_color')
    op.drop_column('configuracion_sistema', 'header_color')
