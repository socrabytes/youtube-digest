"""add video metadata fields

Revision ID: 20250202_video_metadata
Revises: 7fcf15503f1f
Create Date: 2025-02-02 21:12:11.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20250202_video_metadata'
down_revision = '7fcf15503f1f'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('videos', sa.Column('upload_date', sa.String(8), nullable=True))
    op.add_column('videos', sa.Column('like_count', sa.BigInteger(), nullable=True))
    op.add_column('videos', sa.Column('description', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('videos', 'description')
    op.drop_column('videos', 'like_count')
    op.drop_column('videos', 'upload_date')
