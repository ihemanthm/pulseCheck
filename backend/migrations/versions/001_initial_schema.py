"""Initial schema creation

Revision ID: 001
Revises: 
Create Date: 2026-05-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('username', sa.String(255), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=True),
        sa.Column('role', sa.String(50), server_default='operator'),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username'),
    )
    op.create_index('ix_users_username', 'users', ['username'])
    
    # Create csv_uploads table
    op.create_table(
        'csv_uploads',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('filename', sa.String(255), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('row_count', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(50), server_default='processing'),
        sa.Column('s3_key', sa.String(500), nullable=True),
        sa.Column('s3_upload_status', sa.String(50), server_default='pending'),
        sa.Column('s3_error_message', sa.Text(), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    
    # Create orders table
    op.create_table(
        'orders',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('upload_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('invoice_number', sa.String(255), nullable=False),
        sa.Column('sku', sa.String(255), nullable=True),
        sa.Column('product_name', sa.String(255), nullable=False),
        sa.Column('customer_name', sa.String(255), nullable=False),
        sa.Column('customer_phone', sa.String(20), nullable=False),
        sa.Column('purchase_date', sa.Date(), nullable=True),
        sa.Column('amount_paid', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('purchase_mode', sa.String(50), nullable=True),
        sa.Column('brand', sa.String(255), nullable=True),
        sa.Column('purchase_qty', sa.Integer(), nullable=True),
        sa.Column('extra_fields', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('call_status', sa.String(50), server_default='pending'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['upload_id'], ['csv_uploads.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('invoice_number'),
    )
    op.create_index('ix_orders_upload_id', 'orders', ['upload_id'])
    op.create_index('ix_orders_invoice_number', 'orders', ['invoice_number'])
    op.create_index('ix_orders_customer_phone', 'orders', ['customer_phone'])
    op.create_index('ix_orders_call_status', 'orders', ['call_status'])
    
    # Create call_logs table
    op.create_table(
        'call_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('bolna_call_id', sa.String(255), nullable=False),
        sa.Column('triggered_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('connected_at', sa.DateTime(), nullable=True),
        sa.Column('ended_at', sa.DateTime(), nullable=True),
        sa.Column('webhook_received_at', sa.DateTime(), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('call_status', sa.String(50), server_default='triggered'),
        sa.Column('raw_webhook_payload', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('retry_count', sa.Integer(), server_default='0'),
        sa.Column('last_error', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('bolna_call_id'),
    )
    op.create_index('ix_call_logs_order_id', 'call_logs', ['order_id'])
    op.create_index('ix_call_logs_bolna_call_id', 'call_logs', ['bolna_call_id'])
    op.create_index('ix_call_logs_call_status', 'call_logs', ['call_status'])
    op.create_index('ix_call_logs_webhook_received_at', 'call_logs', ['webhook_received_at'])
    
    # Create feedback table
    op.create_table(
        'feedback',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('call_log_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('nps_score', sa.Numeric(precision=3, scale=1), nullable=True),
        sa.Column('nps_category', sa.String(50), nullable=True),
        sa.Column('overall_sentiment', sa.String(50), nullable=True),
        sa.Column('primary_feedback', sa.Text(), nullable=True),
        sa.Column('issue_raised', sa.Text(), nullable=True),
        sa.Column('positive_highlight', sa.Text(), nullable=True),
        sa.Column('escalation_flag', sa.Boolean(), server_default='false'),
        sa.Column('manual_review_required', sa.Boolean(), server_default='false'),
        sa.Column('callback_requested', sa.Boolean(), server_default='false'),
        sa.Column('callback_datetime', sa.DateTime(), nullable=True),
        sa.Column('call_language', sa.String(50), nullable=True),
        sa.Column('verbatim_quote', sa.Text(), nullable=True),
        sa.Column('transcript', sa.Text(), nullable=True),
        sa.Column('call_summary', sa.Text(), nullable=True),
        sa.Column('review_status', sa.String(50), nullable=True),
        sa.Column('reviewed_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('review_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('raw_bolna_feedback', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['call_log_id'], ['call_logs.id']),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id']),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('call_log_id'),
    )
    op.create_index('ix_feedback_call_log_id', 'feedback', ['call_log_id'])
    op.create_index('ix_feedback_order_id', 'feedback', ['order_id'])
    op.create_index('ix_feedback_nps_category', 'feedback', ['nps_category'])
    op.create_index('ix_feedback_overall_sentiment', 'feedback', ['overall_sentiment'])
    op.create_index('ix_feedback_escalation_flag', 'feedback', ['escalation_flag'])
    op.create_index('ix_feedback_manual_review_required', 'feedback', ['manual_review_required'])
    
    # Create audit_log table
    op.create_table(
        'audit_log',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('resource_type', sa.String(50), nullable=False),
        sa.Column('resource_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('status', sa.String(50), server_default='success'),
        sa.Column('details', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_audit_log_user_id', 'audit_log', ['user_id'])
    op.create_index('ix_audit_log_action', 'audit_log', ['action'])
    op.create_index('ix_audit_log_resource_type', 'audit_log', ['resource_type'])
    op.create_index('ix_audit_log_created_at', 'audit_log', ['created_at'])


def downgrade() -> None:
    op.drop_table('audit_log')
    op.drop_table('feedback')
    op.drop_table('call_logs')
    op.drop_table('orders')
    op.drop_table('csv_uploads')
    op.drop_table('users')
