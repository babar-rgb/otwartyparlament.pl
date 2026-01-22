"""add_seo_fields_to_votes

Revision ID: 2fba725e5e14
Revises: 5bafb5a3eb82
Create Date: 2026-01-22 18:17:01.295678

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2fba725e5e14'
down_revision: Union[str, None] = '5bafb5a3eb82'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


from sqlalchemy.dialects.postgresql import JSONB

def upgrade() -> None:
    op.add_column('votes', sa.Column('street_title', sa.String(), nullable=True))
    op.add_column('votes', sa.Column('meta_description', sa.String(), nullable=True))
    op.add_column('votes', sa.Column('seo_keywords', JSONB, nullable=True))


def downgrade() -> None:
    op.drop_column('votes', 'seo_keywords')
    op.drop_column('votes', 'meta_description')
    op.drop_column('votes', 'street_title')
