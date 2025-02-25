"""add subscriber_count to video

Revision ID: 7fcf15503f1f
Revises: 42363399d203
Create Date: 2025-02-03 02:04:43.903197

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7fcf15503f1f'
down_revision = '42363399d203'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('videos', sa.Column('subscriber_count', sa.Integer(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('videos', 'subscriber_count')
    # ### end Alembic commands ###
