"""Add LLM extraction data field to Feedback

Revision ID: 003
Revises: 002
Create Date: 2026-05-20 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add LLM extraction data column to feedback table
    op.add_column('feedback', sa.Column('llm_extraction_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    # Drop LLM extraction data column
    op.drop_column('feedback', 'llm_extraction_data')
