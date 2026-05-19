# PulseCheck - Quick Start Guide

## 🚀 5-Minute Setup

### Prerequisites
- Docker & Docker Compose installed, OR
- Python 3.11+, Node.js 18+, PostgreSQL 16

## Option 1: Docker Compose (Recommended)

```bash
# 1. Navigate to project
cd pulseCheck

# 2. Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Configure backend/.env
# Edit with your:
# - BOLNA_API_KEY
# - BOLNA_AGENT_ID
# - AWS credentials (optional, for S3)

# 4. Start all services
docker-compose up

# In another terminal, seed database (optional)
cd backend && python -m scripts.seed_data
```

Services start automatically:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Database**: postgresql://pulsecheck@localhost:5432/pulsecheck

---

## Option 2: Local Development

### Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup database
export DATABASE_URL="postgresql://user:password@localhost:5432/pulsecheck"
alembic upgrade head

# Create admin user (one-time)
python -c "from app.services.auth import AuthService; from app.models import User; \
from sqlalchemy import create_engine; from sqlalchemy.orm import sessionmaker; \
print('Run migrations first, then create user')"

# Start server
uvicorn app.main:app --reload
```

Server: http://localhost:8000

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend: http://localhost:5173

---

## 📋 Initial Login

Use these default credentials after database seeding:

| Role | Username | Password |
|------|----------|----------|
| Operator | `operator1` | `TestPassword123` |
| Reviewer | `reviewer1` | `TestPassword123` |
| Admin | `admin` | `TestPassword123` |

**⚠️ Change these passwords in production!**

---

## 🧪 Testing Features

### 1. Upload Sample Orders

Download sample CSV from `/backend/sample_data/sample_orders.csv` or:

```
Invoice,SKU,Product,Customer,Phone,Date,Amount,Mode,Brand,Qty
INV-001,SKU-1,iPhone 15,Rajesh Kumar,9876543210,2026-05-01,99999,online,Apple,1
```

Upload via: **Orders > Upload CSV**

### 2. Trigger Calls

After uploading:
1. Go to **Orders** page
2. Select orders → **Trigger Calls**
3. Watch call status update to "scheduled"

### 3. Simulate Webhook

Since we don't have real Bolna API, test webhook manually:

```bash
curl -X POST http://localhost:8000/api/calls/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "call_id": "bolna-123456",
    "status": "completed",
    "duration": 180,
    "transcript": "Customer feedback transcript",
    "extractions": {
      "nps_score": 9,
      "sentiment": "positive",
      "issue_raised": null
    }
  }'
```

### 4. View Analytics

Go to **Analytics** page to see:
- KPI summary cards
- NPS trend chart
- Sentiment distribution
- Top issues

### 5. Manual Review

For feedback with NPS < 6 or sentiment = "negative":
1. Go to **Review** page
2. View pending items
3. **Approve** or **Reject** with notes

---

## 📁 Key Files to Know

| File | Purpose |
|------|---------|
| `/backend/.env` | Backend configuration (API keys, database) |
| `/backend/app/main.py` | FastAPI app entry point |
| `/backend/app/models/` | Database models (SQLAlchemy) |
| `/backend/app/services/` | Business logic (Bolna, CSV, etc.) |
| `/frontend/src/App.jsx` | React router and layout |
| `/frontend/src/pages/` | Page components |
| `/docker-compose.yml` | All services configuration |

---

## 🔗 API Endpoints (Key)

```
Authentication
  POST   /auth/login
  POST   /auth/refresh
  GET    /auth/me

Orders
  POST   /api/orders/upload
  GET    /api/orders
  GET    /api/orders/{id}

Calls
  POST   /api/calls/trigger
  GET    /api/calls
  POST   /api/calls/webhook

Analytics
  GET    /api/analytics/summary
  GET    /api/analytics/nps-trend
  GET    /api/analytics/sentiment-by-product
  GET    /api/analytics/pending-reviews
```

Full docs: http://localhost:8000/docs

---

## ⚙️ Configuration

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/pulsecheck

# Bolna (get from https://www.bolna.dev)
BOLNA_API_KEY=your_key
BOLNA_AGENT_ID=your_agent_id

# AWS S3 (optional, for CSV storage)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# JWT (change in production)
JWT_SECRET=your-secret-key-min-32-characters-long

# Frontend
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000/api
```

---

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
psql -U pulsecheck -d pulsecheck -c "SELECT 1"

# If error, ensure DATABASE_URL is correct
# postgresql+asyncpg://user:password@host:port/database
```

### Bolna API Error

- Verify `BOLNA_API_KEY` is correct
- Check `BOLNA_AGENT_ID` exists
- Ensure network access to https://api.bolna.dev

### Frontend Can't Reach API

- Check `VITE_API_URL` in `.env` matches backend URL
- Verify backend is running (`http://localhost:8000/docs`)
- Check CORS: backend should allow `FRONTEND_URL`

### Port Already in Use

```bash
# Frontend (5173)
lsof -i :5173 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Backend (8000)
lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# PostgreSQL (5432)
lsof -i :5432 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

---

## 📚 Next Steps

1. **Configure Bolna**: Add your agent in BOLNA_AGENT_ID
2. **Setup AWS S3**: Create bucket and add credentials
3. **Create Users**: Via admin panel or database
4. **Load Sample Data**: Use sample_orders.csv
5. **Test Workflows**: Upload → Trigger → Simulate Webhook → Review

---

## 📞 Support

For issues:
1. Check backend logs: `docker-compose logs backend`
2. Check frontend console: Browser DevTools > Console
3. Check API: http://localhost:8000/docs
4. See [README.md](./README.md) for detailed documentation

---

**Version**: 1.0.0 MVP  
**Last Updated**: May 19, 2026
