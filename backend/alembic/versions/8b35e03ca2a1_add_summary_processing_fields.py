"""add summary processing fields

Revision ID: 8b35e03ca2a1
Revises: 20250202_video_metadata
Create Date: 2025-02-03 18:19:23.123456

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import Enum
from app.models.video import ProcessingStatus

# revision identifiers, used by Alembic.
revision = '8b35e03ca2a1'
down_revision = '20250202_video_metadata'
branch_labels = None
depends_on = None

def upgrade():
    # Add new columns
    op.add_column('videos', sa.Column('processing_status', Enum(ProcessingStatus), nullable=False, server_default='pending'))
    op.add_column('videos', sa.Column('transcript_source', sa.String(length=10), nullable=True))
    op.add_column('videos', sa.Column('openai_usage', sa.JSON(), nullable=True))
    op.add_column('videos', sa.Column('last_processed', sa.DateTime(), nullable=True))

def downgrade():
    # Drop columns
    op.drop_column('videos', 'last_processed')
    op.drop_column('videos', 'openai_usage')
    op.drop_column('videos', 'transcript_source')
    op.drop_column('videos', 'processing_status')
