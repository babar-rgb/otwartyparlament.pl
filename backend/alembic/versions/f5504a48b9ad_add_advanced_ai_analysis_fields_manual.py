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
    # --- Votes Table ---
    # Check what else is missing. Base on the crash, expert_summary is missing.
    # We should add pros, cons, personas and expert_summary to votes.
    op.add_column('votes', sa.Column('expert_summary', sa.Text(), nullable=True))
    op.add_column('votes', sa.Column('pros', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('votes', sa.Column('cons', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('votes', sa.Column('personas', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    
    # --- Interpellations Table ---
    op.add_column('interpellations', sa.Column('expert_summary', sa.Text(), nullable=True))
    op.add_column('interpellations', sa.Column('street_title', sa.String(), nullable=True))
    op.add_column('interpellations', sa.Column('meta_description', sa.String(), nullable=True))
    op.add_column('interpellations', sa.Column('seo_keywords', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('interpellations', sa.Column('pros', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('interpellations', sa.Column('cons', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('interpellations', sa.Column('personas', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


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
