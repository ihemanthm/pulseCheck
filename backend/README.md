# PulseCheck Backend - Technical Documentation

## Overview

The PulseCheck backend is a FastAPI-based REST API serving as the core of the voice feedback collection platform. It handles:

- User authentication and role-based authorization
- CSV order import and validation
- Bolna API integration for outbound calls
- Webhook processing with idempotent handling
- Feedback extraction and sentiment analysis
- AWS S3 file storage
- Analytics and reporting
- Audit logging

## Architecture

### Layer Structure

```
┌─────────────────────────────────────┐
│  API Routers (endpoints)            │
├─────────────────────────────────────┤
│  Pydantic Schemas (validation)      │
├─────────────────────────────────────┤
│  Services (business logic)          │
├─────────────────────────────────────┤
│  SQLAlchemy Models (data layer)     │
├─────────────────────────────────────┤
│  PostgreSQL Database                │
└─────────────────────────────────────┘
```

### Directory Structure

```
app/
├── models/              # SQLAlchemy ORM models
│   ├── __init__.py
│   ├── user.py
│   ├── csv_upload.py
│   ├── order.py
│   ├── call_log.py
│   ├── feedback.py
│   └── audit_log.py
│
├── schemas/             # Pydantic validation models
│   ├── auth.py
│   ├── orders.py
│   ├── calls.py
│   ├── feedback.py
│   └── analytics.py
│
├── routers/             # API endpoint handlers
│   ├── auth.py
│   ├── orders.py
│   ├── calls.py
│   └── webhooks.py
│
├── services/            # Business logic
│   ├── auth.py          # Password hashing
│   ├── bolna.py         # Bolna API calls
│   ├── csv_processor.py # CSV parsing
│   ├── s3.py            # AWS S3 operations
│   ├── sentiment.py     # Sentiment analysis
│   └── webhook.py       # Webhook processing
│
├── utils/               # Helper utilities
│   ├── logger.py        # structlog setup
│   ├── errors.py        # Custom exceptions
│   └── phone.py         # Phone validation
│
├── config.py            # Configuration management
├── db.py                # Database setup
├── auth.py              # JWT token handling
├── dependencies.py      # Dependency injection
├── middleware.py        # CORS, rate limiting, logging
└── main.py              # FastAPI app initialization
```

## Key Components

### 1. Configuration (`config.py`)

Uses Pydantic `Settings` to manage environment variables with validation:

```python
class Settings(BaseSettings):
    # Database
    database_url: str
    
    # Bolna API
    bolna_api_key: str
    bolna_agent_id: str
    bolna_base_url: str = "https://api.bolna.dev"
    
    # AWS S3
    aws_access_key_id: str
    aws_secret_access_key: str
    aws_region: str = "ap-south-1"
    s3_bucket_name: str
    
    # JWT
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    
    class Config:
        env_file = ".env"
```

### 2. Database (`db.py`)

Sets up async SQLAlchemy with PostgreSQL:

```python
engine = create_async_engine(
    settings.database_url,
    echo=False,
    pool_size=20,
    max_overflow=0,
    pool_pre_ping=True
)

async_session_maker = sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)
```

### 3. Authentication (`auth.py`)

JWT token generation and validation:

```python
class JWTService:
    @staticmethod
    def create_access_token(user_id, username, role, expires_hours=24):
        # Returns signed JWT token valid for 24 hours
        
    @staticmethod
    def create_refresh_token(user_id, expires_days=7):
        # Returns refresh token valid for 7 days
        
    @staticmethod
    def verify_token(token, token_type="access"):
        # Validates signature and expiration
```

### 4. Authorization (`dependencies.py`)

Dependency injection for role-based access:

```python
async def get_current_user(token: str = Depends(...)):
    # Returns authenticated User object from JWT

async def get_current_operator(user: User = Depends(get_current_user)):
    # Validates user has operator role

async def get_current_reviewer(user: User = Depends(get_current_user)):
    # Validates user has reviewer role

async def get_current_admin(user: User = Depends(get_current_user)):
    # Validates user has admin role
```

### 5. Services Layer

#### AuthService (services/auth.py)
- Password hashing with bcrypt (12 rounds)
- Password verification
- Password strength validation (8+ chars, uppercase, digit)

#### BolnaService (services/bolna.py)
- Triggers outbound calls via Bolna API
- Maps order context to call variables
- Handles API errors gracefully

#### S3Service (services/s3.py)
- Non-blocking CSV uploads
- Async boto3 operations
- Pre-signed URL generation

#### CSVProcessor (services/csv_processor.py)
- Flexible CSV parsing with pandas
- Phone number validation
- Duplicate detection
- Extra column handling (JSON storage)

#### SentimentService (services/sentiment.py)
- NPS to sentiment mapping
- Manual review rule evaluation (5 rules)
- Priority level assignment

#### WebhookProcessor (services/webhook.py)
- Idempotent webhook handling
- Raw payload storage
- Feedback extraction
- Manual review flagging

### 6. Models (Data Layer)

All models use UUID primary keys and include:

```python
# Example Order Model
class Order(Base):
    __tablename__ = "orders"
    
    id: Mapped[UUID] = mapped_column(primary_key=True)
    upload_id: Mapped[UUID] = mapped_column(ForeignKey("csv_uploads.id"))
    invoice_number: Mapped[str] = mapped_column(unique=True, index=True)
    customer_phone: Mapped[str] = mapped_column(index=True)
    call_status: Mapped[str] = mapped_column(index=True)
    extra_fields: Mapped[dict] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    
    # Relationships
    call_logs: Mapped[list["CallLog"]] = relationship(back_populates="order")
    feedback: Mapped[list["Feedback"]] = relationship(back_populates="order")
```

### 7. Schemas (Validation Layer)

Pydantic v2 models for request/response validation:

```python
class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=8)

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
```

### 8. Routers (API Endpoints)

#### auth.py
- `POST /auth/login` - Authenticate user (10/min rate limit)
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user info

#### orders.py
- `POST /api/orders/upload` - Import CSV orders
- `GET /api/orders` - List orders (paginated, filterable)
- `GET /api/orders/{order_id}` - Get order detail

#### calls.py
- `POST /api/calls/trigger` - Trigger calls for orders
- `GET /api/calls` - List call logs
- `POST /api/calls/webhook` - Receive Bolna webhook

## Important Patterns

### Async/Await Pattern

All database operations use async SQLAlchemy:

```python
async def upload_csv(file: UploadFile, db: AsyncSession = Depends(get_db)):
    # Async operations
    stmt = select(Order).where(Order.invoice_number == invoice_no)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
```

### Error Handling

Custom exception hierarchy for consistent error handling:

```python
class PulseCheckException(Exception):
    """Base exception"""
    pass

class BolnaAPIError(PulseCheckException):
    """Bolna API specific errors"""
    pass

class S3UploadError(PulseCheckException):
    """S3 upload errors (non-blocking)"""
    pass

class InvalidPhoneError(PulseCheckException):
    """Phone validation errors"""
    pass
```

### Structured Logging

All logging uses structlog with JSON output:

```python
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Logs as JSON with context
logger.info("call_triggered", order_id=str(order_id), bolna_call_id=bolna_id)
logger.error("api_error", service="bolna", error=str(e))
```

### Idempotent Webhook Processing

Webhook idempotency is achieved via:

1. **Unique Constraint**: `bolna_call_id` is unique in `call_logs` table
2. **Received Timestamp**: `webhook_received_at` prevents duplicate processing
3. **Raw Storage**: Complete webhook payload stored before processing

```python
async def process_webhook(payload: dict, db: AsyncSession):
    # Get bolna_call_id from payload
    bolna_call_id = payload.get("call_id")
    
    # Check if webhook already processed (idempotency)
    stmt = select(CallLog).where(CallLog.bolna_call_id == bolna_call_id)
    existing_call = await db.execute(stmt)
    
    if existing_call and existing_call.webhook_received_at:
        return True  # Already processed, skip
    
    # Store raw payload first
    call_log.raw_webhook_payload = payload
    
    # Then process extraction...
```

### Manual Review Rules

5 conditions trigger manual review:

```python
def should_flag_manual_review(feedback: Feedback) -> bool:
    rules = [
        feedback.escalation_flag,
        feedback.overall_sentiment == 'negative' and feedback.nps_score < 5,
        feedback.callback_requested and not feedback.callback_datetime,
        feedback.nps_score < 6 and feedback.issue_raised,
        any(keyword in feedback.issue_raised for keyword in CRITICAL_KEYWORDS)
    ]
    return any(rules)
```

### Context Variables Mapping

Every Bolna call includes customer context:

```python
variables = {
    "customer_name": order.customer_name,
    "product_name": order.product_name,
    "sku": order.sku,
    "purchase_channel": order.purchase_mode,
    "purchase_date": order.purchase_date.isoformat(),
    "brand_name": order.brand,
    "amount_paid": str(order.amount_paid),
    "purchase_qty": order.purchase_qty,
    "order_context": json.dumps({
        "invoice_number": order.invoice_number,
        "upload_id": str(upload_id),
        "internal_call_id": str(call_id)
    })
}
```

## Testing

### Running Tests

```bash
# Run all tests with coverage
pytest tests/ -v --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py -v

# Run with markers
pytest -m "not integration" -v
```

### Test Structure

```
tests/
├── conftest.py                  # Pytest fixtures and setup
├── test_auth.py                 # Authentication tests
├── test_csv_processor.py        # CSV parsing tests
├── test_phone_validation.py     # Phone number tests
├── test_webhook_processor.py    # Webhook idempotency tests
├── test_sentiment_service.py    # Sentiment analysis tests
└── test_api_endpoints.py        # API endpoint tests
```

## Migrations

Alembic manages database schema versions:

```bash
# Create a new migration
alembic revision --autogenerate -m "Add new column"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Performance Considerations

### Database Indexes

Strategic indexes on frequently queried columns:

```sql
CREATE INDEX idx_orders_call_status ON orders(call_status);
CREATE INDEX idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX idx_call_logs_bolna_call_id ON call_logs(bolna_call_id);
CREATE INDEX idx_feedback_manual_review ON feedback(manual_review_required);
```

### Connection Pooling

SQLAlchemy connection pool configured with:
- Pool size: 20
- Max overflow: 0 (strict limit)
- Pre-ping: True (connection health check)

### Rate Limiting

slowapi implementation:
- Auth endpoints: 10 requests/minute (per IP)
- General endpoints: 100 requests/minute (per IP)

## Deployment

### Docker Deployment

```bash
# Build image
docker build -t pulsecheck-backend:latest .

# Run container
docker run -p 8000:8000 \
  -e DATABASE_URL="postgresql+asyncpg://..." \
  -e BOLNA_API_KEY="..." \
  pulsecheck-backend:latest
```

### Environment Variables Required

```
DATABASE_URL                # PostgreSQL connection string
BOLNA_API_KEY               # Bolna API authentication
BOLNA_AGENT_ID              # Bolna agent configuration
AWS_ACCESS_KEY_ID           # AWS S3 access
AWS_SECRET_ACCESS_KEY       # AWS S3 secret
AWS_REGION                  # S3 region (default: ap-south-1)
S3_BUCKET_NAME              # S3 bucket for CSV storage
JWT_SECRET                  # JWT signing key (min 32 chars)
JWT_ALGORITHM               # JWT algorithm (default: HS256)
FRONTEND_URL                # Frontend origin for CORS
APP_ENV                     # Environment (development/production)
LOG_LEVEL                   # Logging level (INFO/DEBUG/ERROR)
```

## Troubleshooting

### Database Connection

```python
# Test database connection
from sqlalchemy import text
async with engine.connect() as conn:
    result = await conn.execute(text("SELECT 1"))
```

### Async Context Issues

Always use proper async context managers:

```python
# Correct ✓
async with async_session_maker() as session:
    result = await session.execute(...)

# Wrong ✗
session = async_session_maker()  # Not awaited
```

### Webhook Debugging

Log raw webhook payload for debugging:

```python
logger.debug("webhook_received", payload=json.dumps(payload, indent=2))
```

## Documentation

- **API Docs**: Available at `/docs` (Swagger UI) and `/redoc` (ReDoc)
- **Code Comments**: Docstrings on all classes and functions
- **Type Hints**: Full type annotations for IDE support

---

**Backend Version**: 1.0.0  
**Python**: 3.11+  
**Framework**: FastAPI 0.104.1
