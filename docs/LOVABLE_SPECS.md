# Lovable.dev - Expenses Monitor Frontend Specification

## 🎯 Project Overview

**Application Name:** Expenses Monitor  
**Purpose:** Personal expense tracking and financial management web application  
**Target Platform:** Web (Desktop + Mobile Responsive)  
**Tech Stack:** Next.js 15, TypeScript, shadcn/ui, TanStack Query, Recharts

---

## 🏗️ Architecture

### Backend Integration
- **Base URL:** `https://your-api-domain.com` (configurable via env)
- **Authentication:** Keycloak OAuth2/OIDC
- **API Format:** REST JSON
- **CORS:** Enabled for frontend origin

### Core Technologies to Use
```json
{
  "framework": "Next.js 15 (App Router)",
  "language": "TypeScript (strict mode)",
  "ui": "shadcn/ui + Tailwind CSS",
  "state": "TanStack Query (React Query v5)",
  "forms": "React Hook Form + Zod validation",
  "charts": "Recharts",
  "auth": "@auth/nextjs with Keycloak provider",
  "date": "date-fns",
  "icons": "lucide-react"
}
```

---

## 📊 API Specification

### OpenAPI Documentation

**Complete API specification:** [`openapi.yaml`](./openapi.yaml)

The backend API is fully documented using OpenAPI 3.0 specification. Key features:
- **Authentication:** Bearer token (Keycloak OAuth2)
- **Base URL:** Configurable via environment
- **Format:** JSON for requests/responses (except SSE endpoints)
- **Error Handling:** Consistent error format with code + detail

### Quick Reference

You can view and test the API using:
- **Swagger UI:** Import `openapi.yaml` into [swagger.io/tools/swagger-editor](https://editor.swagger.io/)
- **Postman:** Import the OpenAPI spec directly
- **CLI:** Use `openapi-generator` to generate client code

### Main Endpoints Summary

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health_check` | Health check |
| GET | `/greet` | Simple greeting test |
| GET | `/api/balance` | Get total balance |
| POST | `/api/payments` | Create payment |
| GET | `/api/payments/recent` | List recent payments |
| DELETE | `/api/payments/{id}` | Delete payment |
| GET | `/api/payments/categories` | Get categories (SSE) |
| GET | `/api/wallets` | List wallets |
| POST | `/api/wallets` | Create wallet |
| DELETE | `/api/wallets/{id}` | Delete wallet |

### TypeScript Types (Generated from OpenAPI)

```typescript
interface Payment {
  id: string;                      // UUID
  merchantName: string;
  amountInCents: number;           // Positive = income, Negative = expense
  category: string;
  accountingDate: string;          // ISO date (YYYY-MM-DD)
  description?: string;
  wallet: string;
  tags?: Tag[];
}

interface Wallet {
  id: string;                      // UUID
  name: string;                    // Unique
}

interface Tag {
  key: string;
  value: string;
}

interface Balance {
  totalInCents: number;
}

interface ErrorDto {
  code: string;
  detail: string;
}
```

---

## 🎨 UI/UX Requirements

### Design Style
- **Theme:** Modern, clean financial dashboard
- **Color Palette:**
  - Primary: Professional blue (#0ea5e9 or similar)
  - Success: Green for income/positive
  - Danger: Red for expenses/negative
  - Neutral: Slate gray tones
- **Typography:** Clean sans-serif (Inter, system fonts)
- **Layout:** Sidebar navigation + main content area
- **Responsive:** Mobile-first, collapsible sidebar on small screens

### Key Design Principles
1. **Clarity:** Numbers and amounts prominently displayed
2. **Speed:** Quick data entry with smart defaults
3. **Visual Hierarchy:** Important info (balance, recent items) at top
4. **Feedback:** Loading states, success/error toasts
5. **Accessibility:** WCAG 2.1 AA compliant

---

## 📱 Pages & Features

### 1. Dashboard (Home) `/`
**Purpose:** High-level financial overview

**Components:**
- **Balance Card:** Large, prominent display
  - Show total balance in euros (convert from cents)
  - Color-coded: green if positive, red if negative
  - Small trend indicator if possible
  
- **Quick Actions:**
  - Button: "Add Expense" (primary CTA)
  - Button: "Add Income"
  - Button: "Manage Wallets"

- **Recent Payments Table:**
  - Last 10-20 transactions
  - Columns: Date, Merchant, Category, Amount, Wallet, Actions
  - Actions: View details, Delete (with confirmation)
  - Pagination or infinite scroll
  - Filters: Date range, category, wallet

- **Quick Stats (Optional):**
  - This month total
  - Last 30 days average
  - Top category

### 2. Add Payment `/payments/new`
**Purpose:** Quick expense entry form

**Form Fields:**
1. **Type Toggle:** Income (+) / Expense (-) radio buttons
2. **Merchant Name:** Text input (required)
3. **Amount:** Number input in euros (convert to cents on submit)
   - Auto-format with € symbol
   - 2 decimal places
4. **Category:** Autocomplete/select (required)
   - Load from backend
   - Filter as user types
   - Show recent categories first
5. **Wallet:** Select dropdown (required)
   - Load from backend
   - Default to user's primary/first wallet
6. **Date:** Date picker (required)
   - Default to today
   - Italian locale (DD/MM/YYYY)
7. **Description:** Textarea (optional)
   - Placeholder: "Add notes..."
8. **Tags:** Dynamic key-value pairs (optional)
   - Add/remove tag rows
   - Format: Key input + Value input + Remove button

**Behavior:**
- **Validation:** Real-time with Zod
- **Submit:** Show loading spinner
- **Success:** Toast notification + redirect to dashboard or clear form
- **Error:** Display error message inline

**UX Enhancements:**
- Save draft to localStorage
- Keyboard shortcuts (Enter to submit, Esc to clear)
- Duplicate last payment feature

### 3. Payments List `/payments`
**Purpose:** Full transaction history with search/filter

**Features:**
- Data table with sorting
- Filters:
  - Date range (predefined: This week, This month, Last 3 months, Custom)
  - Category multi-select
  - Wallet multi-select
  - Amount range
  - Search by merchant/description
- Export to CSV button
- Bulk delete (checkbox selection)
- Pagination: 50 items per page

**Table Columns:**
- Date (sortable)
- Merchant (with description tooltip)
- Category (badge/chip)
- Wallet (badge/chip)
- Amount (color-coded: red for expenses, green for income)
- Tags (if any, show count with popover)
- Actions (delete, edit)

### 4. Wallets Management `/wallets`
**Purpose:** Create, view, delete wallets

**Layout:**
- Grid/list of wallet cards
- Each card shows:
  - Wallet name
  - Number of transactions (if trackable)
  - Delete button (with confirmation)

**Add Wallet:**
- Inline form or modal
- Fields:
  - Name (required, unique validation)
- Error handling:
  - Show "Name already exists" for duplicate
  - Show "Cannot delete: has payments" for FK violation

**Behavior:**
- Confirm before delete with message: "Are you sure? This wallet contains X payments."
- Disable delete if wallet is in use (or handle gracefully)

### 5. Analytics (Future - Link to External) `/analytics`
**Purpose:** Link to Grafana dashboards

**Content:**
- Grid of cards linking to external Grafana:
  - Overall Trend
  - Current Month
  - Transportation
  - Travel
  - Welfare Tickets
- Each card: Icon + Title + "Open Dashboard" button
- Opens in new tab/iframe if embeddable

---

## 🔐 Authentication Flow

### Keycloak Integration
1. **Login Page** `/login`:
   - "Sign in with Keycloak" button
   - Redirect to Keycloak hosted login
2. **Callback:** Handle OAuth2 callback
3. **Protected Routes:** All pages except `/login` require auth
4. **Token Management:**
   - Store in secure httpOnly cookies
   - Auto-refresh before expiry
5. **Logout:**
   - Clear session
   - Redirect to Keycloak logout endpoint

### UI Elements
- **Header:** User avatar/name + logout button
- **Session Expiry:** Show modal "Session expired, please login again"

---

## 🎯 Advanced Features (Nice to Have)

### 1. Dark Mode
- Toggle in header/settings
- Persist preference to localStorage
- Use next-themes library

### 2. Notifications
- Toast notifications with sonner or similar
- Types: Success, Error, Info, Warning

### 3. Offline Support (Progressive)
- Cache recent data with TanStack Query
- Show stale data with indicator
- Queue mutations when offline

### 4. Smart Input
- Remember last used wallet
- Suggest categories based on merchant name
- Auto-complete merchant names from history

### 5. Budget Tracking (Future)
- Set monthly budget per category
- Show progress bars
- Alert when approaching limit

### 6. Multi-Currency (Future)
- Support multiple currencies
- Conversion rates
- Display in preferred currency

---

## 🛠️ Technical Implementation Notes

### State Management
```typescript
// Use TanStack Query for server state
const { data: balance } = useQuery({
  queryKey: ['balance'],
  queryFn: fetchBalance,
  staleTime: 30000 // 30s
});

// Use zustand or React Context for UI state (theme, sidebar, etc.)
```

### Form Validation
```typescript
const paymentSchema = z.object({
  merchantName: z.string().min(1, "Merchant name required"),
  amountInCents: z.number().int().positive(),
  category: z.string().min(1, "Category required"),
  wallet: z.string().min(1, "Wallet required"),
  accountingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().optional(),
  tags: z.array(z.object({
    key: z.string(),
    value: z.string()
  })).optional()
});
```

### Currency Display
```typescript
// Helper function
const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(cents / 100);
};
```

### API Client
```typescript
// Use axios or fetch with interceptor for auth token
// Set up base URL from environment variable
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth interceptor
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken(); // from auth library
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 🚀 Deployment Considerations

### Environment Variables
```env
NEXT_PUBLIC_API_URL=https://api.expmonitor.freeddns.org
NEXT_PUBLIC_KEYCLOAK_URL=https://auth.expmonitor.freeddns.org
NEXT_PUBLIC_KEYCLOAK_REALM=expenses-monitor
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=frontend-client
NEXTAUTH_SECRET=<generate-secret>
NEXTAUTH_URL=https://expmonitor.freeddns.org
```

### Build Output
- Static export if no server-side features needed
- Or Vercel/Netlify deployment
- Or Docker container for Kubernetes (like current setup)

### Dockerfile (if needed)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --production
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📋 Acceptance Criteria Checklist

### Must Have (MVP)
- [ ] User can login with Keycloak
- [ ] Dashboard shows current balance
- [ ] User can add a new expense/income
- [ ] User can view list of recent payments
- [ ] User can delete a payment
- [ ] User can create/delete wallets
- [ ] Form validation works correctly
- [ ] Error handling with user-friendly messages
- [ ] Responsive design (mobile + desktop)
- [ ] Loading states for all async operations

### Should Have
- [ ] Payment list with filters (date, category, wallet)
- [ ] Balance color-coded (positive/negative)
- [ ] Category autocomplete
- [ ] Tags support in payments
- [ ] Confirm dialogs for destructive actions
- [ ] Toast notifications
- [ ] Keyboard shortcuts for common actions

### Nice to Have
- [ ] Dark mode
- [ ] Export to CSV
- [ ] Duplicate payment feature
- [ ] Bulk operations
- [ ] Payment edit functionality
- [ ] Charts on dashboard
- [ ] Budget tracking

---

## 🎨 Component Library (shadcn/ui)

### Components to Install
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label select textarea
npx shadcn-ui@latest add form dialog alert toast table
npx shadcn-ui@latest add dropdown-menu avatar badge
npx shadcn-ui@latest add date-picker calendar
npx shadcn-ui@latest add command # for autocomplete
```

---

## 🧪 Testing Priorities

1. **Authentication flow** - Login/logout works
2. **Payment creation** - Form validation and submission
3. **Data display** - Balance and payments list render correctly
4. **Error handling** - API errors show user-friendly messages
5. **Wallet management** - CRUD operations work
6. **Responsive design** - Mobile view functional

---

## 📞 Support & Questions

### Backend Developer Contact
- **Email:** andrea.morabito@example.com
- **Backend Repo:** See backend-rust/ directory
- **API Documentation:** Generate from backend or see routes in src/routes/

### Design References
- Inspiration: Mint.com, YNAB, Expense Manager apps
- Color Palette: Material Design or similar professional palette
- Icons: Lucide React (included with shadcn/ui)

---

## 🎯 Lovable.dev Specific Instructions

### Initial Prompt for Lovable
```
Create a Next.js 15 expense tracking web application called "Expenses Monitor".

Tech Stack:
- Next.js 15 with App Router
- TypeScript (strict mode)
- shadcn/ui + Tailwind CSS for UI
- TanStack Query for data fetching
- React Hook Form + Zod for forms
- NextAuth with Keycloak provider for authentication

Core Features:
1. Dashboard showing total balance (from API: GET /api/balance)
2. Add Payment form with fields: merchant name, amount (in cents), category, wallet, date, description, tags
3. Recent payments list with delete functionality
4. Wallet management (create, list, delete wallets)
5. Keycloak authentication protecting all routes except login

API Base URL: Configurable via env variable
Backend uses Bearer token authentication via Keycloak

Design: Modern financial dashboard with professional blue theme, responsive mobile-first design, clean typography

Please create the complete project structure with:
- Proper authentication setup
- API client with interceptors
- All pages mentioned above
- Form validation
- Error handling with toast notifications
- Loading states
- Responsive layout with sidebar navigation
```

### Iteration Prompts
After initial generation, refine with:
1. "Add currency formatting to display amounts in euros"
2. "Implement payment filters (date range, category, wallet)"
3. "Add dark mode toggle"
4. "Implement tags functionality in payment form"
5. "Add confirmation dialogs for delete operations"

---

## 📝 Notes

- **Backend is Rust-based** (Actix-web) - frontend doesn't need to know this
- **Database:** PostgreSQL (backend handles this)
- **Existing Infrastructure:** Kubernetes, ArgoCD, Grafana for analytics
- **Future Migration:** This Next.js frontend will replace the current Angular frontend
- **Browser Support:** Modern browsers only (ES2020+), no IE11

---

## ✅ Success Metrics

After implementation, verify:
1. ✅ All API endpoints integrate correctly
2. ✅ Authentication flow completes successfully
3. ✅ Forms validate and submit data correctly
4. ✅ Error states handled gracefully
5. ✅ Mobile responsive on all pages
6. ✅ Load times < 2s on fast connection
7. ✅ No console errors in production build
8. ✅ TypeScript builds with no errors

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-22  
**Created for:** Lovable.dev Project Generation
