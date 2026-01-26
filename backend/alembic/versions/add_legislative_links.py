"""
Database migration: Add legislative linking infrastructure
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'add_legislative_links'
down_revision = '0c63e45b9185'  # Current head
branch_labels = None
depends_on = None


def upgrade():
    # Create legislative_links table (central linking)
    op.create_table(
        'legislative_links',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('source_type', sa.String(50), nullable=False),
        sa.Column('source_id', sa.Integer(), nullable=False),
        sa.Column('target_type', sa.String(50), nullable=False),
        sa.Column('target_id', sa.Integer(), nullable=False),
        sa.Column('link_type', sa.String(50), nullable=False),
        sa.Column('confidence', sa.Float(), server_default='1.0'),
        sa.Column('metadata', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('source_type', 'source_id', 'target_type', 'target_id', 'link_type', 
                           name='uq_legislative_link')
    )
    
    # Create indexes for performance
    op.create_index('ix_legislative_links_source', 'legislative_links', ['source_type', 'source_id'])
    op.create_index('ix_legislative_links_target', 'legislative_links', ['target_type', 'target_id'])
    op.create_index('ix_legislative_links_type', 'legislative_links', ['link_type'])
    
    # Create amendments table
    op.create_table(
        'amendments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('bill_id', sa.Integer(), nullable=True),
        sa.Column('amendment_number', sa.String(50), nullable=True),
        sa.Column('title', sa.Text(), nullable=True),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('author_mp_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(50), nullable=True),
        sa.Column('vote_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['bill_id'], ['bills.id']),
        sa.ForeignKeyConstraint(['author_mp_id'], ['mps.id']),
        sa.ForeignKeyConstraint(['vote_id'], ['votes.id']),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index('ix_amendments_bill_id', 'amendments', ['bill_id'])
    
    # Add columns to votes table
    op.add_column('votes', sa.Column('amendment_id', sa.Integer(), nullable=True))
    op.add_column('votes', sa.Column('legislative_stage', sa.String(50), nullable=True))
    op.create_foreign_key('fk_votes_amendment', 'votes', 'amendments', ['amendment_id'], ['id'])
    
    # Add columns to bills table
    op.add_column('bills', sa.Column('parent_bill_id', sa.Integer(), nullable=True))
    op.add_column('bills', sa.Column('enacted_law_id', sa.Integer(), nullable=True))
    op.add_column('bills', sa.Column('status_timeline', postgresql.JSONB(), nullable=True))
    op.create_foreign_key('fk_bills_parent', 'bills', 'bills', ['parent_bill_id'], ['id'])


def downgrade():
    # Remove foreign keys
    op.drop_constraint('fk_bills_parent', 'bills', type_='foreignkey')
    op.drop_constraint('fk_votes_amendment', 'votes', type_='foreignkey')
    
    # Remove columns
    op.drop_column('bills', 'status_timeline')
    op.drop_column('bills', 'enacted_law_id')
    op.drop_column('bills', 'parent_bill_id')
    op.drop_column('votes', 'legislative_stage')
    op.drop_column('votes', 'amendment_id')
    
    # Drop tables
    op.drop_index('ix_amendments_bill_id', 'amendments')
    op.drop_table('amendments')
    
    op.drop_index('ix_legislative_links_type', 'legislative_links')
    op.drop_index('ix_legislative_links_target', 'legislative_links')
    op.drop_index('ix_legislative_links_source', 'legislative_links')
    op.drop_table('legislative_links')
