"""Add call content and billing fields to CallLog

Revision ID: 002
Revises: 001
Create Date: 2026-05-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to call_logs table
    op.add_column('call_logs', sa.Column('conversation_duration', sa.Float(), nullable=True))
    op.add_column('call_logs', sa.Column('transcript', sa.Text(), nullable=True))
    op.add_column('call_logs', sa.Column('summary', sa.Text(), nullable=True))
    op.add_column('call_logs', sa.Column('extracted_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('call_logs', sa.Column('total_cost', sa.Float(), nullable=True))
    op.add_column('call_logs', sa.Column('cost_breakdown', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('call_logs', sa.Column('usage_breakdown', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('call_logs', sa.Column('agent_id', sa.String(255), nullable=True))
    op.add_column('call_logs', sa.Column('feedback_id', postgresql.UUID(as_uuid=True), nullable=True))
    
    # Add foreign key constraint for feedback_id
    op.create_foreign_key(
        'fk_call_logs_feedback_id',
        'call_logs',
        'feedback',
        ['feedback_id'],
        ['id']
    )


def downgrade() -> None:
    # Drop foreign key constraint
    op.drop_constraint('fk_call_logs_feedback_id', 'call_logs', type_='foreignkey')
    
    # Drop columns
    op.drop_column('call_logs', 'conversation_duration')
    op.drop_column('call_logs', 'transcript')
    op.drop_column('call_logs', 'summary')
    op.drop_column('call_logs', 'extracted_data')
    op.drop_column('call_logs', 'total_cost')
    op.drop_column('call_logs', 'cost_breakdown')
    op.drop_column('call_logs', 'usage_breakdown')
    op.drop_column('call_logs', 'agent_id')
    op.drop_column('call_logs', 'feedback_id')
