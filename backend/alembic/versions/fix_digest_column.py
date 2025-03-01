"""fix digest column name

Revision ID: 984ee94d7893
Revises: 0c8a27cd5e10
Create Date: 2025-03-01 16:15:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '984ee94d7893'
down_revision = '0c8a27cd5e10'
branch_labels = None
depends_on = None


def upgrade():
    # Rename digest to content for consistency with the model
    op.alter_column('digests', 'digest', new_column_name='content')


def downgrade():
    # Rename content back to digest
    op.alter_column('digests', 'content', new_column_name='digest')
