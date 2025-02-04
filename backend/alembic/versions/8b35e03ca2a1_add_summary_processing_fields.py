"""add summary processing fields

Revision ID: 8b35e03ca2a1
Revises: 20250202_video_metadata
Create Date: 2025-02-03 18:19:23.123456

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '8b35e03ca2a1'
down_revision = '20250202_video_metadata'
branch_labels = None
depends_on = None

def upgrade():
    # Create enum type first
    op.execute("CREATE TYPE processingstatus AS ENUM ('pending', 'processing', 'completed', 'failed')")
    
    # Add new columns
    op.add_column('videos', sa.Column('processing_status', sa.Enum('pending', 'processing', 'completed', 'failed', name='processingstatus'), nullable=False, server_default='pending'))
    op.add_column('videos', sa.Column('transcript_source', sa.String(length=10), nullable=True))
    op.add_column('videos', sa.Column('openai_usage', sa.JSON(), nullable=True))
    op.add_column('videos', sa.Column('last_processed', sa.DateTime(), nullable=True))

def downgrade():
    # Drop columns first
    op.drop_column('videos', 'last_processed')
    op.drop_column('videos', 'openai_usage')
    op.drop_column('videos', 'transcript_source')
    op.drop_column('videos', 'processing_status')
    
    # Drop enum type
    op.execute('DROP TYPE processingstatus')
