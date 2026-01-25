"""add_grouping_fields_to_votes

Revision ID: 0c63e45b9185
Revises: 2fba725e5e14
Create Date: 2026-01-25 22:23:33.828807

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0c63e45b9185'
down_revision: Union[str, None] = '2fba725e5e14'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('votes', sa.Column('is_procedural', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('votes', sa.Column('parent_vote_id', sa.Integer(), sa.ForeignKey('votes.id'), nullable=True))


def downgrade() -> None:
    op.drop_column('votes', 'parent_vote_id')
    op.drop_column('votes', 'is_procedural')
