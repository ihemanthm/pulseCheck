// Call statuses
export const CALL_STATUS = {
  PENDING: 'pending',
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  NO_ANSWER: 'no_answer'
}

export const CALL_STATUS_LABELS = {
  pending: 'Pending',
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  failed: 'Failed',
  no_answer: 'No Answer'
}

export const CALL_STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  no_answer: 'bg-orange-100 text-orange-800'
}

// Sentiments
export const SENTIMENT = {
  POSITIVE: 'positive',
  NEUTRAL: 'neutral',
  NEGATIVE: 'negative'
}

export const SENTIMENT_LABELS = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative'
}

export const SENTIMENT_COLORS = {
  positive: 'bg-green-100 text-green-800',
  neutral: 'bg-gray-100 text-gray-800',
  negative: 'bg-red-100 text-red-800'
}

// NPS Categories
export const NPS_CATEGORY = {
  PROMOTER: 'promoter',
  NEUTRAL: 'neutral',
  DETRACTOR: 'detractor'
}

export const NPS_CATEGORY_LABELS = {
  promoter: 'Promoter (9-10)',
  neutral: 'Neutral (7-8)',
  detractor: 'Detractor (0-6)'
}

// Review Status
export const REVIEW_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
}

export const REVIEW_STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected'
}

export const REVIEW_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
}

// User Roles
export const USER_ROLE = {
  OPERATOR: 'operator',
  REVIEWER: 'reviewer',
  ADMIN: 'admin'
}

export const USER_ROLE_LABELS = {
  operator: 'Operator',
  reviewer: 'Reviewer',
  admin: 'Administrator'
}

// Upload Status
export const UPLOAD_STATUS = {
  PROCESSING: 'processing',
  DONE: 'done',
  ERROR: 'error'
}

export const UPLOAD_STATUS_COLORS = {
  processing: 'bg-blue-100 text-blue-800',
  done: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800'
}

// Priority Levels
export const PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
}

export const PRIORITY_LABELS = {
  high: 'High Priority',
  medium: 'Medium Priority',
  low: 'Low Priority'
}

export const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800'
}

// Pagination
export const DEFAULT_PAGE_SIZE = 50
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

// Time ranges for analytics
export const TIME_RANGES = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
  THREE_MONTHS: 'three_months',
  YEAR: 'year'
}

export const TIME_RANGE_LABELS = {
  today: 'Today',
  week: 'Last 7 Days',
  month: 'Last 30 Days',
  three_months: 'Last 90 Days',
  year: 'Last Year'
}

// Purchase modes
export const PURCHASE_MODE = {
  STORE: 'store',
  ONLINE: 'online'
}

export const PURCHASE_MODE_LABELS = {
  store: 'In-Store',
  online: 'Online'
}

// Toast notification types
export const TOAST_TYPE = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning'
}

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REFRESH: '/auth/refresh',
  ME: '/auth/me',
  
  // Orders
  UPLOAD_CSV: '/orders/upload',
  LIST_ORDERS: '/orders',
  GET_ORDER: '/orders/:id',
  WEBHOOK_STATUS: '/orders/:id/webhook-status',
  
  // Calls
  TRIGGER_CALLS: '/calls/trigger',
  LIST_CALLS: '/calls',
  GET_CALL: '/calls/:id',
  RETRY_CALL: '/calls/:id/retry',
  WEBHOOK: '/calls/webhook',
  
  // Analytics
  ANALYTICS_SUMMARY: '/analytics/summary',
  NPS_TREND: '/analytics/nps-trend',
  CALL_OUTCOMES: '/analytics/call-outcomes',
  SENTIMENT_BY_PRODUCT: '/analytics/sentiment-by-product',
  TOP_ISSUES: '/analytics/top-issues',
  PENDING_REVIEWS: '/analytics/pending-reviews',
  AUDIT_TRAIL: '/analytics/audit-trail',
  
  // Feedback/Review
  PENDING_FEEDBACK: '/feedback/pending',
  REVIEW_FEEDBACK: '/feedback/:id/review'
}
