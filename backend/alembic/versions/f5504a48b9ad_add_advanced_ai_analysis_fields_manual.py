"""Add advanced AI analysis fields manual

Revision ID: f5504a48b9ad
Revises: 90147bddef74
Create Date: 2026-02-08 13:52:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'f5504a48b9ad'
down_revision: Union[str, None] = '90147bddef74'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # --- Votes Table ---
    columns_votes = [c['name'] for c in inspector.get_columns('votes')]
    new_votes_cols = [
        ('expert_summary', sa.Text()),
        ('pros', postgresql.JSONB(astext_type=sa.Text())),
        ('cons', postgresql.JSONB(astext_type=sa.Text())),
        ('personas', postgresql.JSONB(astext_type=sa.Text()))
    ]
    for col_name, col_type in new_votes_cols:
        if col_name not in columns_votes:
            op.add_column('votes', sa.Column(col_name, col_type, nullable=True))
    
    # --- Interpellations Table ---
    columns_interp = [c['name'] for c in inspector.get_columns('interpellations')]
    new_interp_cols = [
        ('expert_summary', sa.Text()),
        ('street_title', sa.String()),
        ('meta_description', sa.String()),
        ('seo_keywords', postgresql.JSONB(astext_type=sa.Text())),
        ('pros', postgresql.JSONB(astext_type=sa.Text())),
        ('cons', postgresql.JSONB(astext_type=sa.Text())),
        ('personas', postgresql.JSONB(astext_type=sa.Text()))
    ]
    for col_name, col_type in new_interp_cols:
        if col_name not in columns_interp:
            op.add_column('interpellations', sa.Column(col_name, col_type, nullable=True))


def downgrade() -> None:
    # Drop columns from votes
    op.drop_column('votes', 'expert_summary')
    op.drop_column('votes', 'pros')
    op.drop_column('votes', 'cons')
    op.drop_column('votes', 'personas')
    
    # Drop columns from interpellations
    op.drop_column('interpellations', 'expert_summary')
    op.drop_column('interpellations', 'street_title')
    op.drop_column('interpellations', 'meta_description')
    op.drop_column('interpellations', 'seo_keywords')
    op.drop_column('interpellations', 'pros')
    op.drop_column('interpellations', 'cons')
    op.drop_column('interpellations', 'personas')
