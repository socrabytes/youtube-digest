"""initial migration

Revision ID: 1a2b3c4d5e6f
Revises: 
Create Date: 2024-12-13 12:39:18.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '1a2b3c4d5e6f'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'videos',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('youtube_id', sa.String(length=20), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=True),
        sa.Column('url', sa.String(length=255), nullable=True),
        sa.Column('thumbnail_url', sa.String(length=255), nullable=True),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('processed', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('youtube_id')
    )
    op.create_index(op.f('ix_videos_youtube_id'), 'videos', ['youtube_id'], unique=True)

def downgrade() -> None:
    op.drop_index(op.f('ix_videos_youtube_id'), table_name='videos')
    op.drop_table('videos')
