# PulseCheck Frontend - Technical Documentation

## Overview

The PulseCheck frontend is a React 18 + Vite single-page application (SPA) providing a complete user interface for:

- User authentication
- CSV order uploads
- Call triggering and management
- Analytics dashboards
- Manual review workflow
- Audit trail viewing

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool with hot module replacement
- **React Router v6** - Client-side routing
- **Recharts** - Data visualization (charts, graphs)
- **TailwindCSS** - Utility-first CSS framework
- **shadcn/ui** - Headless UI component library
- **Axios** - HTTP client with interceptors
- **Vitest** - Unit testing framework

## Project Structure

```
src/
├── pages/               # Page components (top-level routes)
│   ├── LoginPage.jsx
│   ├── UploadPage.jsx
│   ├── OrdersPage.jsx
│   ├── CallsPage.jsx
│   ├── AnalyticsPage.jsx
│   └── ReviewPage.jsx
│
├── components/          # Reusable UI components
│   ├── Navigation/
│   │   └── Header.jsx
│   ├── Orders/
│   │   ├── OrderTable.jsx
│   │   ├── OrderFilter.jsx
│   │   └── OrderDetail.jsx
│   ├── Calls/
│   │   ├── CallList.jsx
│   │   ├── CallStatus.jsx
│   │   └── CallRetry.jsx
│   ├── Analytics/
│   │   ├── KPISummary.jsx
│   │   ├── NPSChart.jsx
│   │   ├── SentimentChart.jsx
│   │   └── IssuesList.jsx
│   ├── Forms/
│   │   ├── LoginForm.jsx
│   │   └── CSVUpload.jsx
│   └── Common/
│       ├── Toast.jsx
│       ├── Modal.jsx
│       ├── Loading.jsx
│       └── ErrorBoundary.jsx
│
├── api/                 # API client layer
│   ├── client.js        # Axios instance with auth
│   ├── auth.js          # Authentication endpoints
│   ├── orders.js        # Order endpoints
│   ├── calls.js         # Call endpoints
│   └── analytics.js     # Analytics endpoints
│
├── context/             # React Context for state
│   ├── AuthContext.jsx  # User auth state
│   ├── ToastContext.jsx # Toast notifications
│   └── DataContext.jsx  # Shared app data
│
├── hooks/               # Custom React hooks
│   ├── useAuth.js       # Auth hook
│   ├── useAsync.js      # Async data fetching
│   ├── useForm.js       # Form handling
│   └── usePagination.js # Pagination logic
│
├── utils/               # Helper functions
│   ├── formatters.js    # Date, number, phone formatters
│   ├── validators.js    # Input validation
│   ├── constants.js     # App constants and enums
│   └── errorHandler.js  # Error handling utilities
│
├── styles/              # Global styles
│   └── globals.css      # Tailwind imports
│
├── App.jsx              # Root component with routing
├── main.jsx             # React entry point
└── index.css            # Main CSS file

public/
├── index.html
└── favicon.ico

tests/
├── components.test.jsx
├── pages.test.jsx
├── api.test.js
└── hooks.test.js

.env.example            # Environment variables template
package.json            # npm dependencies
vite.config.js          # Vite configuration
tailwind.config.js      # TailwindCSS configuration
vitest.config.js        # Vitest configuration
```

## Setup & Development

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with API URL
# VITE_API_URL=http://localhost:8000/api
```

### Development Server

```bash
# Start Vite dev server (HMR enabled)
npm run dev
```

Server runs on http://localhost:5173 with hot module replacement.

### Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

Output: `dist/` directory with optimized assets.

## Key Components

### 1. Pages

#### LoginPage.jsx
- JWT token-based authentication
- Username/password form
- Token storage in localStorage
- Redirect to dashboard on success
- Error handling with toasts

#### UploadPage.jsx
- Drag-and-drop CSV upload
- File validation and preview
- Progress indicator
- Success/error feedback
- Sample CSV download button

#### OrdersPage.jsx
- Paginated order list
- Status filtering (pending, scheduled, completed, failed)
- Search by customer name or invoice
- Order detail modal
- Call triggering for selected orders
- Bulk action support

#### CallsPage.jsx
- Call log history
- Status filtering
- Duration and outcome tracking
- Webhook received indicator
- Call retry button for failed calls
- Real-time polling for updates (2s interval)

#### AnalyticsPage.jsx
- KPI summary cards (total orders, calls, pending reviews)
- NPS trend line chart
- Sentiment distribution pie chart
- Call outcome bar chart
- Top issues list
- Time range filtering

#### ReviewPage.jsx
- Pending reviews list
- NPS score and sentiment display
- Issue details and escalation flag
- Approve/Reject workflow
- Review notes input
- Priority indicator

### 2. Components

#### Navigation/Header.jsx
```jsx
- Logo and branding
- Navigation links (Orders, Calls, Analytics, Review)
- User menu (profile, logout)
- Role-based menu visibility
- Mobile responsive hamburger menu
```

#### Orders/OrderTable.jsx
```jsx
// Features:
- Infinite scroll or pagination
- Sortable columns
- Status badges with colors
- Expandable rows for detail
- Checkbox selection for bulk actions
- Loading skeleton
```

#### Analytics/NPSChart.jsx
```jsx
// Recharts line chart:
- X-axis: Date
- Y-axis: Average NPS
- Multiple series support
- Legend and tooltip
- Responsive sizing
```

#### Forms/CSVUpload.jsx
```jsx
// File upload component:
- Drag-and-drop zone
- File validation (CSV only, <10MB)
- Progress bar
- Error messages
- Success confirmation
```

### 3. API Client Layer

#### api/client.js
```javascript
// Axios instance with:
- Base URL from environment
- Default headers
- Request/response interceptors
- Token attachment to every request
- Token refresh on 401
- Error transformation
```

#### api/orders.js
```javascript
export const ordersAPI = {
  uploadCSV: (file) => POST /upload with multipart
  listOrders: (filters, page) => GET /api/orders
  getOrder: (id) => GET /api/orders/{id}
  triggerCalls: (orderIds) => POST /api/calls/trigger
}
```

#### api/calls.js
```javascript
export const callsAPI = {
  listCalls: (filters, page) => GET /api/calls
  getCall: (id) => GET /api/calls/{id}
  retryCall: (id) => POST /api/calls/{id}/retry
  checkWebhookStatus: (orderId) => GET /api/orders/{id}/webhook-status
}
```

#### api/analytics.js
```javascript
export const analyticsAPI = {
  getSummary: () => GET /api/analytics/summary
  getNPSTrend: (days) => GET /api/analytics/nps-trend
  getCallOutcomes: () => GET /api/analytics/call-outcomes
  getSentimentByProduct: () => GET /api/analytics/sentiment-by-product
  getTopIssues: () => GET /api/analytics/top-issues
  getPendingReviews: () => GET /api/analytics/pending-reviews
}
```

### 4. Context & State Management

#### AuthContext.jsx
```javascript
// Provides:
- user: Current authenticated user
- token: JWT access token
- refreshToken: Refresh token
- login(username, password): Authenticate
- logout(): Clear auth
- isAuthenticated: Boolean check
- hasRole(role): Role verification
```

#### ToastContext.jsx
```javascript
// Toast notifications:
- show(message, type, duration): Display notification
- success(message): Green toast
- error(message): Red toast
- info(message): Blue toast
```

#### DataContext.jsx
```javascript
// Shared app data:
- orders: Cached order list
- calls: Cached call log
- analytics: Analytics data
- refresh(): Refetch all data
```

### 5. Custom Hooks

#### useAuth.js
```javascript
// Hook for authentication:
const { user, token, login, logout, isAuthenticated } = useAuth()
```

#### useAsync.js
```javascript
// Hook for async operations:
const { data, loading, error, execute } = useAsync(apiCall)
```

#### useForm.js
```javascript
// Hook for form handling:
const { values, errors, handleChange, handleSubmit } = useForm(
  initialValues,
  onSubmit,
  validate
)
```

#### usePagination.js
```javascript
// Hook for pagination:
const { page, pageSize, total, goToPage, nextPage, prevPage } = usePagination(
  items,
  pageSize
)
```

## Styling

### TailwindCSS Setup

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0066cc",
        success: "#00b341",
        danger: "#d9534f"
      }
    }
  }
}
```

### Color Scheme

- **Primary**: Blue (#0066cc)
- **Success**: Green (#00b341)
- **Warning**: Orange (#f0ad4e)
- **Danger**: Red (#d9534f)
- **Background**: Light gray (#f5f5f5)

## Authentication Flow

```
1. User enters credentials on LoginPage
   ↓
2. POST /auth/login with username/password
   ↓
3. Backend returns { access_token, refresh_token, expires_in }
   ↓
4. Frontend stores tokens in localStorage
   ↓
5. Axios interceptor adds token to all requests
   ↓
6. On 401 response:
   - Attempt token refresh via POST /auth/refresh
   - If successful: retry original request
   - If failed: redirect to login
```

## Data Fetching Pattern

```javascript
// Typical pattern using useAsync hook:
const OrdersPage = () => {
  const [filters, setFilters] = useState({ status: null, page: 1 })
  
  const { data, loading, error, execute } = useAsync(
    () => ordersAPI.listOrders(filters.status, filters.page)
  )
  
  useEffect(() => {
    execute()
  }, [filters])
  
  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert error={error} />
  
  return (
    <div>
      <OrderFilter onFilterChange={setFilters} />
      <OrderTable orders={data.orders} total={data.total} />
      <Pagination {...data} onPageChange={...} />
    </div>
  )
}
```

## Real-time Updates

### Webhook Status Polling

For calls, check webhook receipt every 2 seconds:

```javascript
const CallsPage = () => {
  const [calls, setCalls] = useState([])
  
  useEffect(() => {
    const interval = setInterval(async () => {
      const updated = await callsAPI.listCalls()
      setCalls(updated)
    }, 2000)
    
    return () => clearInterval(interval)
  }, [])
}
```

## Testing

### Component Tests

```bash
npm test -- components.test.jsx
```

Test structure:

```javascript
import { render, screen, fireEvent } from '@testing-library/react'
import OrderTable from './OrderTable'

describe('OrderTable', () => {
  it('renders orders', () => {
    render(<OrderTable orders={mockOrders} />)
    expect(screen.getByText('INV-001')).toBeInTheDocument()
  })
  
  it('handles row click', () => {
    const onSelect = vi.fn()
    render(<OrderTable orders={mockOrders} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('INV-001'))
    expect(onSelect).toHaveBeenCalled()
  })
})
```

### API Mock

```javascript
// Mock API in tests
vi.mock('../api/orders', () => ({
  ordersAPI: {
    listOrders: vi.fn(() => Promise.resolve({ orders: [], total: 0 }))
  }
}))
```

## Performance Optimizations

1. **Code Splitting**: Pages loaded with React.lazy()
2. **Memoization**: useMemo for expensive calculations
3. **Image Optimization**: Lazy load images below fold
4. **Bundle Analysis**: `npm run build --analyze`
5. **Virtual Scrolling**: For large lists (recharts, tables)

## Deployment

### Build for Production

```bash
# Build
npm run build

# This creates dist/ with:
# - index.html (main entry)
# - js/main.HASH.js (code)
# - css/style.HASH.css (styles)
```

### Deployment to Static Host

```bash
# Deploy dist/ to:
# - AWS S3 + CloudFront
# - Netlify
# - Vercel
# - GitHub Pages
```

### Environment Variables

Update `.env` for deployment:

```
VITE_API_URL=https://api.yourdomain.com/api
```

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile: iOS 12+, Android 8+

## Security Considerations

1. **XSS Protection**: Sanitize user input, use Content Security Policy
2. **CSRF**: CORS properly configured
3. **Token Security**: Store tokens in httpOnly cookies (if possible) or localStorage with secure policies
4. **API Validation**: All input validated server-side

## Troubleshooting

### CORS Issues

```javascript
// Ensure VITE_API_URL in .env matches backend CORS config
VITE_API_URL=http://localhost:8000/api
```

### Token Expiration

```javascript
// Axios interceptor handles 401 refresh automatically
// If not working, check backend JWT_SECRET matches frontend usage
```

### Build Errors

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## Documentation

- **Storybook**: Can be added for component documentation
- **JSDoc**: Inline code documentation with JSDoc comments
- **README**: This file + inline comments in complex components

---

**Frontend Version**: 1.0.0  
**React**: 18.2.0  
**Vite**: 5.0.0  
**Node**: 18.0+
