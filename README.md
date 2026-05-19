# PulseCheck - Voice Feedback Collection & Analytics Platform

A production-grade MVP platform for collecting and analyzing post-purchase voice feedback from retail electronics customers via Bolna AI voice calls.

## Features

- **CSV Order Upload**: Drag-and-drop interface for importing customer order data
- **AI Voice Calls**: Automated outbound calls via Bolna API with context-rich customer information
- **Webhook Processing**: Real-time feedback extraction and storage with idempotent webhook handling
- **Manual Review Workflow**: Automatic flagging of feedback requiring human review based on sentiment/NPS rules
- **Analytics Dashboard**: KPI tracking, NPS trends, sentiment analysis, and escalation management
- **AWS S3 Integration**: Non-blocking CSV storage with async uploads
- **JWT Authentication**: Role-based access control (operator, reviewer, admin)
- **Audit Trail**: Complete logging of all critical actions for compliance and debugging
- **Structured Logging**: JSON logging for ELK/CloudWatch integration

## Tech Stack

### Backend
- **FastAPI** - Async web framework
- **SQLAlchemy 2.0** - Async ORM with PostgreSQL
- **Pydantic v2** - Data validation
- **Alembic** - Database migrations
- **Bolna API** - Outbound AI voice calls
- **AWS S3** - File storage
- **structlog** - Structured JSON logging
- **pytest** - Testing framework

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **React Router v6** - Navigation
- **Recharts** - Analytics visualizations
- **TailwindCSS** - Styling
- **shadcn/ui** - UI components
- **Axios** - HTTP client

### Infrastructure
- **Docker & Docker Compose** - Containerization
- **PostgreSQL 16** - Database
- **Uvicorn** - ASGI server

## Project Structure

```
pulseCheck/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic request/response models
│   │   ├── routers/         # API endpoints
│   │   ├── services/        # Business logic services
│   │   ├── utils/           # Utilities (logging, errors, phone validation)
│   │   ├── config.py        # Configuration
│   │   ├── db.py            # Database setup
│   │   ├── auth.py          # JWT authentication
│   │   ├── dependencies.py  # Dependency injection
│   │   ├── middleware.py    # CORS, rate limiting, logging
│   │   └── main.py          # FastAPI app initialization
│   ├── migrations/          # Alembic database migrations
│   ├── tests/               # pytest test suite
│   ├── sample_data/         # Sample CSV and SQL for testing
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile           # Production Docker image
│   └── .env.example         # Environment variables template
│
├── frontend/
│   ├── src/
│   │   ├── pages/           # React pages (Login, Upload, Orders, Calls, Analytics)
│   │   ├── components/      # React components
│   │   ├── api/             # Axios API client
│   │   ├── context/         # React Context (Auth, Toast)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Utilities (formatters, validators)
│   │   └── App.jsx          # Root component with router
│   ├── public/              # Static assets
│   ├── tests/               # Vitest test suite
│   ├── package.json         # npm dependencies
│   ├── vite.config.js       # Vite configuration
│   ├── Dockerfile.dev       # Development Docker image
│   └── .env.example         # Environment variables template
│
├── docker-compose.yml       # Docker Compose configuration
├── .gitignore               # Git ignore rules
└── README.md                # This file
```

## Getting Started

### Prerequisites

- Docker & Docker Compose (easiest)
- OR: Python 3.11+, PostgreSQL 16, Node.js 18+

### Quick Start with Docker Compose

```bash
# Clone the repository
git clone <repo-url>
cd pulseCheck

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Configure environment variables
# Edit backend/.env with your Bolna API keys and AWS credentials
# BOLNA_API_KEY=your_key
# BOLNA_AGENT_ID=your_agent_id
# AWS_ACCESS_KEY_ID=your_key
# AWS_SECRET_ACCESS_KEY=your_secret

# Start all services
docker-compose up

# In another terminal, create sample users (optional)
docker-compose exec postgres psql -U pulsecheck -d pulsecheck -f /path/to/sample_users.sql
```

Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Database: postgresql://pulsecheck@localhost:5432/pulsecheck

### Local Development (Without Docker)

#### Backend Setup

```bash
cd backend

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure .env
cp .env.example .env
# Edit .env with local database URL and API keys
# DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/pulsecheck

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload
```

Server runs on http://localhost:8000

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy and configure .env
cp .env.example .env

# Start dev server
npm run dev
```

Frontend runs on http://localhost:5173

## Environment Variables

### Backend (.env)

```
# Database
DATABASE_URL=postgresql+asyncpg://pulsecheck:password@localhost:5432/pulsecheck

# Bolna API
BOLNA_API_KEY=your_bolna_api_key
BOLNA_AGENT_ID=your_bolna_agent_id
BOLNA_BASE_URL=https://api.bolna.dev

# AWS S3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=ap-south-1
S3_BUCKET_NAME=pulsecheck-uploads

# JWT
JWT_SECRET=your_secret_key_min_32_chars
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Frontend
FRONTEND_URL=http://localhost:5173

# App Config
APP_ENV=development
LOG_LEVEL=INFO
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:8000/api
```

## Database Schema

### Tables

1. **users** - User accounts with roles (operator, reviewer, admin)
2. **csv_uploads** - CSV upload tracking
3. **orders** - Customer orders with purchase details
4. **call_logs** - Voice call records with Bolna integration
5. **feedback** - Structured feedback extracted from calls
6. **audit_log** - Complete audit trail of system actions

All tables use UUID primary keys and include proper indexing for performance.

## API Endpoints

### Authentication
- `POST /auth/login` - Login with username/password
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user info

### Orders
- `POST /api/orders/upload` - Upload CSV with order data
- `GET /api/orders` - List orders with filtering/pagination
- `GET /api/orders/{order_id}` - Get order details

### Calls
- `POST /api/calls/trigger` - Trigger calls for selected orders
- `GET /api/calls` - List call logs
- `POST /api/webhook/bolna` - Receive Bolna webhook (no auth required)

### Analytics
- `GET /api/analytics/summary` - KPI summary
- `GET /api/analytics/nps-trend` - NPS trend data
- `GET /api/analytics/call-outcomes` - Call outcome distribution
- `GET /api/analytics/sentiment-by-product` - Sentiment breakdown

Full API documentation available at `/docs` when backend is running.

## Testing

### Backend Tests

```bash
cd backend
pytest tests/ -v --cov=app
```

### Frontend Tests

```bash
cd frontend
npm test
```

## Webhook Configuration

When you have Bolna agent configured, add the webhook URL to your Bolna dashboard:

```
https://your-domain/api/calls/webhook
```

The webhook endpoint:
- Receives POST requests from Bolna with call results
- Stores raw payload verbatim for audit trail
- Extracts feedback using feedback extraction rules
- Auto-flags feedback for manual review based on sentiment/NPS
- Returns 200 immediately for idempotency (processes in background)

## Important Notes

### Webhook Order Matching

The system matches incoming webhooks to orders using:
1. **Primary Key**: `bolna_call_id` (Bolna's unique call identifier)
2. **Idempotency**: `webhook_received_at` timestamp prevents duplicate processing
3. **Raw Storage**: Complete Bolna webhook payload stored in `call_logs.raw_webhook_payload`

### Phone Number Handling

- All customer phone numbers are normalized to E.164 format (+919876543210)
- Invalid phone numbers are rejected during CSV upload with detailed error messages
- Phone validation requirements: 10-15 digits

### CSV File Handling

- Supports flexible column naming (case-insensitive, whitespace-trimmed)
- Extra columns are stored as JSON in `orders.extra_fields` for extensibility
- Duplicate detection prevents importing same invoice twice
- S3 upload errors are non-blocking (CSV imports continue)

### Manual Review Workflow

Feedback is automatically flagged for manual review if:
1. `escalation_flag` is set
2. Sentiment is negative AND NPS < 5
3. Callback requested but no callback datetime provided
4. NPS < 6 AND issue is raised
5. Issue text contains critical keywords (defective, broken, damaged, etc.)

## Deployment

### Production Checklist

- [ ] Set strong `JWT_SECRET` (min 32 characters)
- [ ] Configure AWS S3 bucket with versioning and encryption
- [ ] Set up CloudWatch/ELK for JSON log aggregation
- [ ] Configure Bolna webhook URL in their dashboard
- [ ] Create admin user via database or admin panel
- [ ] Set up automated database backups
- [ ] Configure rate limiting thresholds
- [ ] Set up SSL/TLS certificates
- [ ] Configure CORS for production domain
- [ ] Enable database query logging and monitoring

### Docker Compose Production

```bash
# Build production images
docker-compose -f docker-compose.yml build

# Run with production settings
APP_ENV=production docker-compose up -d

# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Restart services
docker-compose restart postgres backend
```

### Bolna API Errors

Check backend logs for API errors:
```bash
docker-compose logs -f backend | grep bolna
```

Verify:
- `BOLNA_API_KEY` is valid
- `BOLNA_AGENT_ID` is correct
- Network connectivity to `https://api.bolna.dev`

### Frontend Not Connecting

Ensure backend URL is correct in frontend `.env`:
```
VITE_API_URL=http://localhost:8000/api
```

Check CORS settings in backend config.

## Contributing

1. Create feature branch
2. Make changes
3. Run tests
4. Submit pull request

## License

Proprietary - PulseCheck

## Support

For issues and support, please contact the development team.

---

**Version**: 1.0.0 MVP  
**Last Updated**: May 19, 2026
