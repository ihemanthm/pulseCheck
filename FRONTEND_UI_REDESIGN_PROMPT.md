# PulseCheck Frontend UI/UX Redesign Prompt

## Project Overview

**Project Name:** PulseCheck - Voice Feedback Collection & Analytics Platform

**Objective:** Transform the current basic React/Vite frontend into a modern, visually appealing, production-ready MVP with excellent UX for managing outbound voice calls and collecting customer feedback.

**Current Tech Stack:**
- React 18 with Vite
- Tailwind CSS for styling
- React Router v6 for navigation
- Recharts for analytics visualization
- Context API for state management
- FastAPI backend (http://localhost:8000/api)

**Timeline:** MVP Phase (High polish, professional quality)

---

## Project Context & Business Model

### What is PulseCheck?
PulseCheck is an automated voice feedback collection platform that helps businesses:
- Upload customer order data via CSV
- Trigger outbound voice calls to customers
- Collect structured feedback (NPS, sentiment, issues)
- Analyze feedback trends with analytics dashboard
- Manage call campaigns and track performance

### Target Users
1. **Operators** - Upload CSV files, trigger calls, monitor campaigns
2. **Reviewers** - Analyze feedback, view analytics, generate reports
3. **Admins** - Manage users, system settings, campaign configurations

### Revenue/Value Model
- Per-minute call charges (track minutes of calls)
- Feedback analytics insights
- Exportable reports for business intelligence
- Scalable multi-tenant ready

---

## Design Philosophy & Brand Guidelines

### Visual Identity
- **Color Palette:**
  - Primary: Vibrant Blue (#2563EB) - Trust, professionalism
  - Secondary: Modern Purple (#8B5CF6) - Innovation, growth
  - Accent: Energetic Green (#10B981) - Success, positivity
  - Neutral: Slate grays (#1F2937, #6B7280, #F3F4F6)
  - Warning: Amber (#F59E0B)
  - Danger: Rose (#EF4444)

- **Typography:**
  - Primary Font: Inter or Poppins (modern, clean)
  - Code Font: JetBrains Mono
  - Font Weights: 400 (regular), 600 (semibold), 700 (bold)

- **UI Components Style:**
  - Modern, rounded corners (8px default border radius)
  - Smooth animations and transitions (200-300ms)
  - Glassmorphism effects where appropriate
  - Micro-interactions on hover/active states
  - Clear visual hierarchy
  - Ample whitespace and breathing room

### Design Principles
1. **Clarity First** - Every action should be clear and obvious
2. **Progressive Disclosure** - Show relevant info, hide complexity
3. **Consistency** - Unified design language across all pages
4. **Accessibility** - WCAG 2.1 AA compliance minimum
5. **Mobile-First** - Responsive design for all devices
6. **Data Visualization** - Clear, insightful charts and metrics

---

## Feature Requirements & User Flows

### Page 1: Dashboard/Home (After Login)
**Purpose:** Executive summary of campaigns and metrics

**Key Sections:**
1. **Welcome Header**
   - Personalized greeting with user role badge
   - Quick action buttons (prominent)

2. **Key Metrics Cards (KPIs)**
   - Total Calls Triggered (this month)
   - Success Rate (%) with trend indicator
   - Average Call Duration
   - NPS Score (if data available)
   - Pending Orders Count
   - Active Campaigns

3. **Recent Activity Feed**
   - Last 5 uploaded CSV files with status
   - Last 5 call campaigns with results
   - Real-time status updates with animations

4. **Call Status Summary (Pie/Donut Chart)**
   - Pending, In Progress, Completed, Failed
   - Drill-down capability to view details

5. **Quick Action Panel**
   - Upload Orders (button)
   - View All Orders (link)
   - View All Calls (link)
   - Analytics Dashboard (link)

6. **Upcoming Features Section (Optional)**
   - Planned campaigns
   - Pending approvals

**Edge Cases:**
- No data yet (empty state with helpful onboarding)
- Loading state with skeleton screens
- Real-time updates without page refresh
- Mobile responsive (stack vertically)

---

### Page 2: Orders Management
**Purpose:** Upload, manage, and monitor customer order data

**Key Sections:**

#### A. Upload Section (Top)
- **Drag & Drop Zone**
  - Large, visually clear drop area
  - Accepted file type indicator (CSV only)
  - Max file size: 10MB
  - Preview of data before upload
  
- **Upload Form**
  - File input with preview
  - Progress bar during upload
  - Success/Error message with clear action items
  
- **Sample CSV Template**
  - Download button for template
  - Instructions on required columns

**Edge Cases:**
- File validation (wrong format, corrupted data)
- Duplicate orders handling (show count, allow review)
- Phone number validation errors (display which rows failed)
- Large file uploads (>5MB) - show progress
- Network interruption - retry capability

#### B. Orders Table/List
- **Column Structure:**
  - Invoice Number (searchable, clickable)
  - Product Name
  - Customer Name
  - Phone Number (masked for privacy)
  - Purchase Date
  - Amount
  - Call Status (with color-coded badge)
  - Last Action (timestamp)
  - Actions (trigger call, view details, retry)

- **Interactive Features:**
  - Sort by any column
  - Filter by status, date range, amount range
  - Search by name, invoice, phone
  - Bulk actions (select multiple → trigger calls)
  - Pagination (50 items/page with selector)
  - Sticky header when scrolling

- **Row Actions:**
  - View Details (modal)
  - Trigger Call (single)
  - View Call History
  - Download Call Recording (when available)
  - Mark as Reviewed
  - Add Note

- **Status Indicators:**
  - Color-coded badges (pending=gray, scheduled=blue, completed=green, failed=red)
  - Hover tooltips explaining status
  - Last updated timestamp

**Edge Cases:**
- Empty state when no orders
- Loading state with skeleton
- Network error during load
- Very long customer names (truncate with tooltip)
- Phone number privacy (partial masking)
- Bulk action confirmation dialog
- Undo recent actions (within 30 seconds)

---

### Page 3: Campaign/Calls Management
**Purpose:** Monitor and manage outbound call campaigns

**Key Sections:**

#### A. Campaign Summary
- **Active Campaigns Card**
  - Campaign name
  - Orders targeted
  - Calls completed/pending
  - Start date and estimated end date
  - Progress bar
  - Action buttons (pause, resume, view details)

#### B. Call Triggers & Bulk Actions
- **Trigger New Campaign Section**
  - Select orders (from table or upload)
  - Show order count preview
  - Estimated duration & cost
  - Confirmation dialog
  - "Trigger Calls" button with loading state

#### C. Call History/Logs
- **Call Log Table**
  - Call ID (unique identifier)
  - Order/Invoice Number
  - Customer Name
  - Call Status (triggered, ringing, connected, completed, failed)
  - Triggered Time
  - Duration (once completed)
  - Outcome (answered, voicemail, no answer, invalid number)
  - Feedback Received (yes/no indicator)

- **Detailed View Modal**
  - Full call information
  - Call transcript (if available)
  - Feedback collected (NPS, sentiment, keywords)
  - Audio player for call recording
  - Action buttons (retry, mark complete, add notes)

- **Filters & Search**
  - Date range picker
  - Status filter (multi-select)
  - Duration range
  - Success/Failure filter
  - Customer search

**Call Status Flow Visual:**
```
Pending → Scheduled → Ringing → Connected → Completed
                                                    ↓
                                    [Feedback] → [Reviewed]

Alternative paths:
- No Answer → Failed
- Invalid Number → Failed
- Busy → Retry Available
```

**Edge Cases:**
- Call still in progress (disable retry button)
- Network failure during trigger (show retry option)
- Bolna API down (show friendly error message with workaround)
- No feedback received (show "Awaiting feedback" state)
- Batch operation partial failure (show breakdown of success/failures)
- Duplicate call prevention (warn if already called today)

---

### Page 4: Analytics & Reports
**Purpose:** Visualize insights from collected feedback

**Key Sections:**

#### A. Top Metrics Section
- **4-Column Layout:**
  - Total Calls Made (with trend ↑/↓)
  - Overall NPS Score (with color: green if >50, yellow if >30, red if <30)
  - Average Sentiment (positive %, neutral %, negative %)
  - Callback Requests (count with urgency badge)

#### B. Charts & Visualizations

1. **Call Status Distribution (Pie/Donut Chart)**
   - Completed vs Failed vs No Answer
   - Clickable segments for drill-down
   - Legend with percentages

2. **NPS Distribution (Horizontal Bar Chart)**
   - Promoters (9-10)
   - Passives (7-8)
   - Detractors (0-6)
   - Trend line if historical data

3. **Sentiment Trend (Line Chart)**
   - Over last 30 days
   - Positive/Neutral/Negative breakdown
   - Toggle for stacked/grouped view

4. **Call Duration Distribution (Histogram)**
   - X-axis: Duration ranges (0-1min, 1-3min, 3-5min, 5+min)
   - Y-axis: Count of calls
   - Average duration line overlay

5. **Issue Categories (Bar Chart)**
   - Top issues raised by customers
   - Horizontal bars for readability
   - Sortable and filterable

6. **Weekly Performance Table**
   - Week, Calls Made, Success Rate, Avg Duration, NPS Score

#### C. Export & Reporting
- **Export Options:**
  - Export as PDF (full report)
  - Export as CSV (data table)
  - Export as PNG (individual charts)
  - Email report option (scheduled)

- **Report Customization:**
  - Date range selector
  - Metric selector (choose what to include)
  - Branding options (logo, colors)

**Edge Cases:**
- No data for selected date range (show empty state with helpful message)
- Insufficient data for statistical significance (show warning)
- Very small samples (disable trend analysis)
- Real-time updates (auto-refresh every 30 seconds or manual refresh)
- Timezone handling (allow user to select timezone)

---

### Page 5: Feedback Details & Review
**Purpose:** Review and manage customer feedback

**Key Sections:**

#### A. Feedback Card/Modal
- **Customer Information**
  - Name, Phone, Order Details
  - Call Date/Time, Duration

- **Feedback Collected**
  - NPS Score (1-10 slider display)
  - Sentiment (emoji indicators: 😔 😐 😊)
  - Primary Issue (category with description)
  - Positive Highlight (if any)
  - Escalation Flag (red badge if flagged)
  - Callback Requested (yes/no with datetime if yes)

- **Call Transcript**
  - Expandable section with full transcript
  - Highlighted key phrases
  - Audio player

- **Actions Available**
  - Mark as Reviewed
  - Flag for Escalation
  - Add Internal Note
  - Send Follow-up Email
  - Request Manual Callback

#### B. Feedback List/Queue
- **Filterable Feedback List**
  - Status (new, reviewed, escalated, resolved)
  - NPS range filter
  - Sentiment filter
  - Escalation filter
  - Date range
  - Search by customer name

- **Batch Actions**
  - Mark multiple as reviewed
  - Bulk flag for escalation
  - Bulk add tags/notes

**Edge Cases:**
- No feedback received (show "Call completed, awaiting feedback")
- Feedback in multiple languages (show translated version)
- Profanity in feedback (flag and mask)
- Incomplete feedback (mark as incomplete, allow follow-up call)
- Very long transcripts (pagination or expandable sections)

---

### Page 6: User Profile & Settings
**Purpose:** Manage user preferences and account settings

**Key Sections:**

#### A. Profile Information
- **User Details**
  - Avatar (editable)
  - Full Name (editable)
  - Email (read-only)
  - Role (read-only)
  - Department (if applicable)

#### B. Preferences
- **Notification Settings**
  - Email notifications toggle
  - SMS notifications toggle
  - In-app notifications toggle
  - Frequency (real-time, daily digest, weekly)

- **Dashboard Preferences**
  - Default dashboard view
  - Metrics to display
  - Refresh frequency

#### C. Security
- **Password Management**
  - Change password form
  - Password strength indicator
  - Session management (active sessions list)

- **API Keys** (for integrations)
  - Generate new key
  - Revoke old keys
  - Usage statistics

**Edge Cases:**
- Password strength validation (real-time feedback)
- Confirm password change via email
- Session timeout warning (5 min before timeout)
- Account recovery options

---

### Page 7: Login & Authentication
**Purpose:** Secure user authentication

**Key Sections:**

#### A. Login Form
- **Clean, Centered Layout**
  - Logo/Branding at top
  - Welcome message
  - Username input (with icon)
  - Password input (show/hide toggle)
  - "Forgot Password?" link
  - "Login" button (prominent)
  - Demo credentials display (subtle, helpful)

#### B. States & Animations
- **Loading State**
  - Spinner button (disable while loading)
  - Loading animation

- **Error States**
  - Invalid credentials (clear error message)
  - Account locked (show unlock options)
  - Network error (with retry option)

- **Success State**
  - Smooth redirect to dashboard
  - Welcome animation

**Edge Cases:**
- Invalid username format (real-time validation)
- Password with special characters (test encoding)
- Caps lock on (show warning)
- Browser remember password (styling should not break)
- Account temporarily locked after 3 failed attempts (show countdown)
- Session expired during navigation (redirect to login with message)

---

## Admin-Only Features

### User Management (Admin Only)
- List all users with roles
- Add new users (form with validation)
- Edit user roles and permissions
- Deactivate/reactivate users
- Reset user passwords
- View user activity logs

### System Settings (Admin Only)
- API configuration
- Integration settings (Bolna, AWS S3)
- Email templates
- Notification settings
- System health monitoring
- Audit logs

---

## Cross-Page Requirements

### Navigation & Layout

**Header/Top Navigation**
- Logo (clickable → home)
- Search bar (global search across orders, calls, feedback)
- Current User Avatar (dropdown: Profile, Settings, Logout)
- Notification Bell (with badge count)
- Help/Documentation link
- Dark mode toggle (optional)

**Sidebar Navigation**
- Collapsible on mobile
- Menu items: Dashboard, Orders, Calls, Analytics, Settings
- Active indicator on current page
- Role-based menu items (Admin sees more options)
- Quick stats in sidebar (total calls, pending orders)

**Mobile Navigation**
- Bottom tab bar on mobile
- Hamburger menu for additional options
- Simplified header

### Global Components

1. **Toast Notifications**
   - Success (green)
   - Error (red)
   - Warning (amber)
   - Info (blue)
   - Auto-dismiss after 5 seconds
   - Dismissible by user

2. **Modals & Dialogs**
   - Confirmation dialogs for destructive actions
   - Clear action buttons (Cancel/Confirm)
   - Escape key to close
   - Click outside to close (optional)

3. **Loading States**
   - Skeleton screens for data tables
   - Shimmer animations
   - Spinner with loading message
   - Progress bars for file uploads

4. **Empty States**
   - Friendly illustrations
   - Helpful messages
   - Action buttons (e.g., "Upload Orders", "Trigger Calls")

5. **Error Boundaries**
   - Catch runtime errors
   - Display error message
   - Offer reload/back options

---

## Accessibility & UX Standards

### WCAG 2.1 AA Compliance
- ✓ Color contrast ratios (4.5:1 for normal text, 3:1 for large text)
- ✓ Keyboard navigation (all interactive elements)
- ✓ Focus indicators (visible, at least 2px)
- ✓ ARIA labels for screen readers
- ✓ Alt text for images
- ✓ Form labels properly associated
- ✓ Error messages clear and linked to inputs

### Mobile Responsiveness
- **Breakpoints:**
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

- **Touch-Friendly:**
  - Min 44px tap targets
  - Adequate spacing between clickables
  - No hover-only states

---

## Business Use Cases & User Workflows

### Use Case 1: Operator - Daily Campaign Execution
1. Login to dashboard
2. See pending orders count
3. Upload new CSV file (100-500 orders)
4. System shows preview and validation
5. Confirm upload
6. Navigate to Calls page
7. Bulk select pending orders
8. Click "Trigger Calls"
9. See progress indicator
10. Real-time status updates
11. Once complete, see summary (X triggered, Y skipped, Z failed)
12. Return to dashboard to see updated metrics

**Edge Cases to Handle:**
- Duplicate phone numbers in CSV
- Invalid phone formats
- Concurrent uploads from multiple operators
- Server timeout during large batch trigger
- Partial success (some calls triggered, some failed)

### Use Case 2: Reviewer - Analytics & Quality Assurance
1. Login to dashboard
2. View NPS and sentiment metrics
3. Click on NPS distribution chart
4. Drill down to see calls with NPS score 0-6 (Detractors)
5. Filter feedback queue by "Escalated" flag
6. Review each feedback item
7. Read transcript and listen to recording
8. Add notes ("Customer wants refund", "Technical issue")
9. Mark items as "Reviewed" or "Escalation Recommended"
10. Export weekly report for management

**Edge Cases to Handle:**
- No feedback data for selected period
- Slow loading of transcripts/recordings
- Feedback in different languages (need translation)
- Very old calls (archive/pagination)

### Use Case 3: Admin - System Monitoring & User Management
1. Login as admin
2. Navigate to Settings → User Management
3. Add new reviewer user
4. Set role and permissions
5. Send welcome email
6. Monitor system health (API status, DB status)
7. View audit logs of user actions
8. Configure Bolna API credentials
9. Configure AWS S3 bucket settings
10. Set up email notification templates

**Edge Cases to Handle:**
- User with same email trying to register
- Admin deleting active user mid-campaign
- API credentials invalid (show error, rollback)
- Audit logs getting very large (pagination)

---

## Performance & Technical Requirements

### Performance Metrics
- **Page Load Time:** < 2 seconds for initial load
- **Time to Interactive:** < 3 seconds
- **API Response:** < 500ms
- **Chart Rendering:** < 1 second
- **Search Results:** < 300ms

### Optimization Techniques
- Code splitting (lazy load routes)
- Image optimization (WebP format, lazy loading)
- Caching strategy (50 orders per API call, then paginate)
- Debounce search input (300ms)
- Throttle scroll events
- React.memo for expensive components
- Virtual scrolling for large lists

### Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Design Consistency Checklist

- [ ] All buttons follow same style (primary, secondary, tertiary variants)
- [ ] All inputs have consistent styling and labels
- [ ] All forms have proper validation and error messaging
- [ ] All tables have consistent sorting/filtering
- [ ] All modals follow same pattern
- [ ] All loading states use same animation
- [ ] All success/error/warning messages use same style
- [ ] Color usage is consistent (blue for actions, green for success, red for errors)
- [ ] Typography hierarchy is consistent (sizes, weights)
- [ ] Spacing/padding follows 8px grid system
- [ ] Icons are from same icon set (e.g., Lucide React, Heroicons)
- [ ] Animations are smooth (200-300ms duration)

---

## Reference: Similar MVP Projects

For design inspiration and best practices, refer to:

1. **Twilio/Vonage Communication Platforms**
   - Clean dashboard with real-time metrics
   - Call management interfaces
   - Clear status indicators and progress tracking

2. **Notion/Airtable Dashboards**
   - Modern card-based layouts
   - Smooth animations and transitions
   - Excellent empty states
   - Progressive disclosure of data

3. **Stripe/Square Admin Panels**
   - Professional color schemes
   - Clear data tables with bulk actions
   - Excellent error handling and messaging
   - Modal workflows for complex actions

4. **Pipedrive/HubSpot CRM**
   - Pipeline and status visualizations
   - Bulk operations with clear feedback
   - Advanced filtering options
   - Customizable dashboards

5. **Datadog/New Relic Monitoring Dashboards**
   - Real-time metric cards
   - Interactive charts and drill-down capabilities
   - Clear KPI displays
   - Historical trend analysis

---

## Deliverables & Success Criteria

### Functional Requirements
- ✓ All pages responsive on mobile, tablet, desktop
- ✓ All workflows tested end-to-end
- ✓ All edge cases handled gracefully
- ✓ All forms validated properly
- ✓ All API integrations working
- ✓ All permissions enforced (role-based access)

### Design Requirements
- ✓ Consistent visual language across all pages
- ✓ Professional, modern appearance
- ✓ WCAG 2.1 AA accessibility compliance
- ✓ Smooth animations and transitions
- ✓ Clear visual hierarchy
- ✓ Proper use of color, typography, spacing

### UX Requirements
- ✓ Intuitive navigation
- ✓ Clear user guidance and onboarding
- ✓ Helpful error messages
- ✓ Loading states and progress indicators
- ✓ Accessibility features (keyboard nav, screen reader support)
- ✓ Performance optimized

### Testing
- ✓ Unit tests for components
- ✓ Integration tests for workflows
- ✓ E2E tests for critical user paths
- ✓ Cross-browser testing
- ✓ Mobile responsiveness testing
- ✓ Accessibility testing (axe, wave)
- ✓ Performance testing (Lighthouse)

---

## Important Notes for UI Agent

1. **Refer to API Documentation:** Check [API_CURL_GUIDE.md](../API_CURL_GUIDE.md) for all backend endpoints and payloads

2. **Current Issues to Fix:**
   - Replace generic placeholder UI with professional design
   - Implement proper loading and error states
   - Add empty states for all list views
   - Improve mobile responsiveness
   - Add proper animations and transitions
   - Implement accessibility features

3. **Must Include:**
   - Real-time feedback from backend
   - Proper token management for authentication
   - Error handling for all API calls
   - Loading states during data fetching
   - Toast notifications for user feedback

4. **Quality Standards:**
   - Code should be clean, well-commented, and maintainable
   - Use TypeScript for better type safety
   - Follow React best practices
   - Use custom hooks for reusable logic
   - Component composition and modularity

5. **Testing:**
   - Include unit tests for key components
   - Include integration tests for workflows
   - Test all edge cases mentioned above
   - Verify accessibility compliance
   - Test on real mobile devices

6. **Performance:**
   - Optimize bundle size
   - Implement code splitting
   - Use lazy loading for routes
   - Optimize images and assets
   - Monitor Lighthouse scores (target: 90+)

---

## Final Thoughts

This is an MVP for a real product that will handle actual customer feedback and call data. The UI/UX should reflect professionalism and reliability. Users should feel confident using this tool for business-critical operations.

Focus on:
- **Clarity** - Users should always know what's happening
- **Confidence** - Professional design builds trust
- **Efficiency** - Workflows should be smooth and quick
- **Reliability** - Error handling and edge cases covered
- **Accessibility** - Inclusive design for all users

Build something you would be proud to use in production! 🚀
