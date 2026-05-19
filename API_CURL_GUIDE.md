# PulseCheck Backend API - CURL Guide

Complete guide to test all backend endpoints with sample CURL requests.

**Base URL:** `http://localhost:8000/api`

**Test Credentials:**
- Operator: `operator1` / `TestPassword123`
- Reviewer: `reviewer1` / `TestPassword123`
- Admin: `admin` / `TestPassword123`

---

## Table of Contents
1. [Health Check](#health-check)
2. [Authentication](#authentication)
3. [Orders Management](#orders-management)
4. [Calls Management](#calls-management)

---

## Health Check

### Check Backend Health
```bash
curl -X GET http://localhost:8000/health
```

**Response:**
```json
{
  "status": "healthy",
  "app": "PulseCheck",
  "environment": "development"
}
```

---

## Authentication

### 1. Login
Get JWT access and refresh tokens for authentication.

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "operator1",
    "password": "TestPassword123"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400
}
```

**Save token for next requests:**
```bash
ACCESS_TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "operator1", "password": "TestPassword123"}' | jq -r '.access_token')

echo "Token: $ACCESS_TOKEN"
```

---

### 2. Refresh Access Token
Get a new access token using refresh token.

```bash
curl -X POST http://localhost:8000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400
}
```

---

### 3. Get Current User Info
Get authenticated user's profile information.

```bash
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "username": "operator1",
  "full_name": "John Operator",
  "role": "operator",
  "is_active": true
}
```

**Practical example with saved token:**
```bash
ACCESS_TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "operator1", "password": "TestPassword123"}' | jq -r '.access_token')

curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## Orders Management

### 1. Upload CSV File with Orders
Upload a CSV file containing customer orders. Only operators and admins can upload.

**CSV Format:**
```
invoice_number,sku,product_name,customer_name,customer_phone,purchase_date,amount_paid,purchase_mode,brand,purchase_qty
INV-20260519-001,SKU-123,iPhone 15,John Doe,9876543210,2026-05-19,99999.00,online,Apple,1
```

```bash
ACCESS_TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "operator1", "password": "TestPassword123"}' | jq -r '.access_token')

curl -X POST http://localhost:8000/api/orders/upload \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@/path/to/orders.csv"
```

**Response:**
```json
{
  "upload_id": "550e8400-e29b-41d4-a716-446655440000",
  "total_rows": 10,
  "new_orders": 9,
  "skipped_duplicates": 1,
  "phone_validation_errors": [],
  "s3_upload_status": "pending",
  "s3_error_message": null
}
```

**Quick Test with Sample CSV:**
```bash
# Create a sample CSV file
cat > /tmp/orders.csv << 'EOF'
invoice_number,sku,product_name,customer_name,customer_phone,purchase_date,amount_paid,purchase_mode,brand,purchase_qty
INV-TEST-001,SKU-001,Laptop,Alice Smith,9123456789,2026-05-19,50000.00,online,Dell,1
INV-TEST-002,SKU-002,Mouse,Bob Jones,9988776655,2026-05-19,1500.00,store,Logitech,2
EOF

# Upload the file
ACCESS_TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "operator1", "password": "TestPassword123"}' | jq -r '.access_token')

curl -X POST http://localhost:8000/api/orders/upload \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@/tmp/orders.csv"
```

---

### 2. List Orders
Get paginated list of orders with optional filtering by status and search.

```bash
ACCESS_TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "operator1", "password": "TestPassword123"}' | jq -r '.access_token')

# Get all orders (page 1, 50 per page)
curl -X GET http://localhost:8000/api/orders \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Response:**
```json
{
  "total": 10,
  "page": 1,
  "page_size": 50,
  "orders": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "invoice_number": "INV-20260501-001",
      "sku": "SKU-APL-IPHONE15",
      "product_name": "iPhone 15 Pro Max",
      "customer_name": "Rajesh Kumar",
      "customer_phone": "9876543210",
      "purchase_date": "2026-05-01",
      "amount_paid": 99999.00,
      "purchase_mode": "online",
      "brand": "Apple",
      "purchase_qty": 1,
      "call_status": "pending",
      "created_at": "2026-05-19T05:06:23.959502Z"
    }
  ]
}
```

**With Filters:**

```bash
# Filter by call status
curl -X GET "http://localhost:8000/api/orders?status=pending" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Search by customer name or invoice
curl -X GET "http://localhost:8000/api/orders?search=Rajesh" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Pagination - page 2 with 20 items per page
curl -X GET "http://localhost:8000/api/orders?page=2&page_size=20" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Combine filters
curl -X GET "http://localhost:8000/api/orders?status=pending&search=Apple&page=1&page_size=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Common Status Values:**
- `pending` - Order awaiting call
- `scheduled` - Call scheduled
- `in_progress` - Call in progress
- `completed` - Call completed
- `failed` - Call failed
- `no_answer` - Customer didn't answer

---

## Calls Management

### 1. Trigger Outbound Calls (Bulk)
Trigger outbound calls for multiple orders. Prevents duplicate calls with smart guard.

```bash
ACCESS_TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "operator1", "password": "TestPassword123"}' | jq -r '.access_token')

curl -X POST http://localhost:8000/api/calls/trigger \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_ids": [
      "550e8400-e29b-41d4-a716-446655440001",
      "550e8400-e29b-41d4-a716-446655440002",
      "550e8400-e29b-41d4-a716-446655440003"
    ]
  }'
```

**Response:**
```json
{
  "triggered": [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002"
  ],
  "skipped": [
    {
      "order_id": "550e8400-e29b-41d4-a716-446655440003",
      "reason": "Order not found"
    }
  ],
  "failed": []
}
```

**Get Order IDs First:**
```bash
# Get order IDs from the list
ACCESS_TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "operator1", "password": "TestPassword123"}' | jq -r '.access_token')

# Extract order IDs
ORDER_IDS=$(curl -s -X GET http://localhost:8000/api/orders?status=pending \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq -r '.orders[0:3] | map(.id) | @json')

echo "Order IDs: $ORDER_IDS"

# Trigger calls
curl -X POST http://localhost:8000/api/calls/trigger \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"order_ids\": $ORDER_IDS}"
```

---

### 2. List Call Logs
Get paginated list of call logs with optional status filtering.

```bash
ACCESS_TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "operator1", "password": "TestPassword123"}' | jq -r '.access_token')

# Get all call logs
curl -X GET http://localhost:8000/api/calls \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Response:**
```json
{
  "total": 5,
  "page": 1,
  "page_size": 50,
  "calls": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "bolna_call_id": "call_20260519_001",
      "call_status": "triggered",
      "triggered_at": "2026-05-19T05:06:30.000000Z",
      "connected_at": null,
      "ended_at": null,
      "webhook_received_at": null,
      "duration_seconds": null,
      "retry_count": 0,
      "feedback": null
    }
  ]
}
```

**With Filters:**

```bash
# Filter by call status
curl -X GET "http://localhost:8000/api/calls?status=triggered" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Pagination
curl -X GET "http://localhost:8000/api/calls?page=1&page_size=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Combine filters
curl -X GET "http://localhost:8000/api/calls?status=completed&page=1&page_size=20" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Common Call Status Values:**
- `triggered` - Call initiated
- `ringing` - Phone ringing
- `connected` - Call connected
- `in_progress` - Call in progress
- `completed` - Call completed
- `failed` - Call failed
- `no_answer` - No answer

---

### 3. Receive Webhook (Bolna Callback)
Endpoint to receive call status updates from Bolna API.

```bash
# This is typically called by Bolna, but you can simulate it:
curl -X POST http://localhost:8000/api/calls/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "call_id": "call_20260519_001",
    "status": "completed",
    "duration": 245,
    "transcript": "Customer: Hello... Agent: Hi there...",
    "summary": "Customer inquired about product warranty",
    "extractions": {
      "nps_score": 8,
      "sentiment": "positive"
    }
  }'
```

**Response:**
```json
{
  "status": "processed",
  "message": "Webhook received and queued for processing"
}
```

---

## Complete Workflow Example

Here's a complete workflow from login to triggering calls:

```bash
#!/bin/bash

# 1. LOGIN
echo "=== Step 1: Login ==="
RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "operator1",
    "password": "TestPassword123"
  }')

ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.access_token')
REFRESH_TOKEN=$(echo $RESPONSE | jq -r '.refresh_token')

echo "Access Token: ${ACCESS_TOKEN:0:50}..."
echo "Refresh Token: ${REFRESH_TOKEN:0:50}..."

# 2. GET CURRENT USER
echo -e "\n=== Step 2: Get Current User ==="
curl -s -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

# 3. LIST ORDERS
echo -e "\n=== Step 3: List Pending Orders ==="
ORDERS=$(curl -s -X GET "http://localhost:8000/api/orders?status=pending&page_size=5" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo $ORDERS | jq '.orders | length' | xargs -I {} echo "Found {} orders"
echo $ORDERS | jq '.orders[0:2]'

# 4. EXTRACT ORDER IDS
ORDER_IDS=$(echo $ORDERS | jq -r '.orders[0:2] | map(.id) | @json')
echo -e "\n=== Step 4: Order IDs to trigger ==="
echo $ORDER_IDS

# 5. TRIGGER CALLS
echo -e "\n=== Step 5: Trigger Calls ==="
curl -s -X POST http://localhost:8000/api/calls/trigger \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"order_ids\": $ORDER_IDS}" | jq .

# 6. LIST CALL LOGS
echo -e "\n=== Step 6: List Recent Calls ==="
curl -s -X GET "http://localhost:8000/api/calls?page=1&page_size=5" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.calls[0:2]'

# 7. REFRESH TOKEN
echo -e "\n=== Step 7: Refresh Token ==="
NEW_TOKENS=$(curl -s -X POST http://localhost:8000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}")

NEW_ACCESS_TOKEN=$(echo $NEW_TOKENS | jq -r '.access_token')
echo "New Access Token: ${NEW_ACCESS_TOKEN:0:50}..."

echo -e "\n=== Workflow Complete ==="
```

**Run the complete workflow:**
```bash
bash workflow.sh
```

---

## Error Handling

### Common Error Responses

**401 Unauthorized - Invalid Token:**
```json
{
  "detail": "Invalid token claims"
}
```

**403 Forbidden - Insufficient Permissions:**
```json
{
  "detail": "Not enough permissions"
}
```

**400 Bad Request - Invalid Input:**
```json
{
  "error": "Bad request",
  "detail": "Invalid username or password"
}
```

**429 Too Many Requests - Rate Limited:**
```json
{
  "detail": "429: Too Many Requests"
}
```

---

## Rate Limits

- **Login:** 10 requests/minute
- **CSV Upload:** 10 requests/minute
- **Trigger Calls:** 100 requests/minute
- **List Endpoints:** Not limited

---

## Tips & Tricks

### Save Token to Variable
```bash
ACCESS_TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "operator1", "password": "TestPassword123"}' | jq -r '.access_token')
```

### Pretty Print JSON Response
```bash
curl -s [URL] -H [HEADERS] | jq .
```

### Count Results
```bash
curl -s [URL] -H [HEADERS] | jq '.orders | length'
```

### Extract Specific Fields
```bash
curl -s [URL] -H [HEADERS] | jq '.orders[] | {id, customer_name, call_status}'
```

### Create Reusable Function
```bash
call_api() {
  local method=$1
  local endpoint=$2
  local data=$3
  
  curl -s -X $method "http://localhost:8000/api$endpoint" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$data"
}

# Usage:
call_api GET "/orders?status=pending"
```

---

## Troubleshooting

**Connection Refused:**
```
curl: (7) Failed to connect to localhost port 8000: Connection refused
```
→ Make sure backend is running: `docker compose ps`

**Invalid Token:**
→ Generate a new token with login endpoint

**CORS Error in Frontend:**
→ Check docker-compose.yml FRONTEND_URL setting

**File Upload Fails:**
→ Ensure file is valid CSV with correct headers

---

## Documentation Links

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **OpenAPI JSON:** http://localhost:8000/openapi.json
