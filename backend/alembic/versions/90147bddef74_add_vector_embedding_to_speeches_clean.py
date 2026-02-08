"""add_vector_embedding_to_speeches_clean

Revision ID: 90147bddef74
Revises: add_legislative_links
Create Date: 2026-01-29 22:34:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector


# revision identifiers, used by Alembic.
revision: str = '90147bddef74'
down_revision: Union[str, None] = 'add_legislative_links'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if column already exists (Safety Shield for out-of-sync VPS databases)
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('speeches')]
    
    if 'vector_embedding' not in columns:
        op.add_column('speeches', sa.Column('vector_embedding', Vector(768), nullable=True))
    else:
        print("ℹ️ Column 'vector_embedding' already exists in 'speeches', skipping.")


def downgrade() -> None:
    op.drop_column('speeches', 'vector_embedding')
