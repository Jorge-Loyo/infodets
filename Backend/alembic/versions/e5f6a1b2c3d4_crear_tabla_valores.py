"""crear tabla_valores

Revision ID: e5f6a1b2c3d4
Revises: d4e5f6a1b2c3
Create Date: 2026-04-29 02:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import uuid
from datetime import datetime

revision: str = 'e5f6a1b2c3d4'
down_revision: Union[str, Sequence[str], None] = 'd4e5f6a1b2c3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

DATOS_INICIALES = {
    'instituciones': ['Ministerio de Administración', 'Secretaría General', 'Dirección Nacional', 'Subsecretaría', 'Organismo Descentralizado'],
    'dependencias':  ['Administración', 'Legal', 'Finanzas', 'Recursos Humanos', 'Tecnología', 'Comunicación'],
    'cargos':        ['Director', 'Coordinador', 'Analista', 'Técnico', 'Administrativo', 'Asesor'],
    'categorias':    ['Resoluciones', 'Normativas', 'Circulares', 'Decretos', 'Informes'],
    'categorias_noticias': ['Institucional', 'Normativa', 'RRHH', 'Tecnología', 'Finanzas'],
    'estados_documento':   ['Procesado', 'Pendiente', 'Error'],
}


def upgrade() -> None:
    op.create_table(
        'tabla_valores',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('tabla_id', sa.String(), nullable=False),
        sa.Column('valor', sa.String(), nullable=False),
        sa.Column('activo', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('orden', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('creado_en', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_tabla_valores_tabla_id', 'tabla_valores', ['tabla_id'])

    # Insertar datos iniciales
    tabla = sa.table('tabla_valores',
        sa.column('id', sa.UUID()),
        sa.column('tabla_id', sa.String()),
        sa.column('valor', sa.String()),
        sa.column('activo', sa.Boolean()),
        sa.column('orden', sa.Integer()),
        sa.column('creado_en', sa.DateTime()),
    )
    rows = []
    for tabla_id, valores in DATOS_INICIALES.items():
        for i, valor in enumerate(valores):
            rows.append({'id': uuid.uuid4(), 'tabla_id': tabla_id, 'valor': valor, 'activo': True, 'orden': i, 'creado_en': datetime.utcnow()})
    op.bulk_insert(tabla, rows)


def downgrade() -> None:
    op.drop_index('ix_tabla_valores_tabla_id', 'tabla_valores')
    op.drop_table('tabla_valores')
