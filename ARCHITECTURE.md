# EDGARS Clothing Store - Architecture Guide

## 🏗️ Project Architecture Overview

This document explains the overall structure and design patterns used in the EDGARS clothing store application.

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Browser / Client                      │
│              (React 19.2 Components)                     │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│            Next.js 15 (App Router)                      │
│  Pages, Components, Middleware, API Routes             │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ├─────────────────┬────────────────────┐
                   │                 │                    │
                   ▼                 ▼                    ▼
        ┌──────────────────┐  ┌─────────────┐   ┌────────────────┐
        │  Supabase Auth   │  │  Supabase   │   │  Static Files  │
        │  (Email/Password)│  │  Database   │   │  & Images      │
        │                  │  │ (PostgreSQL)│   │                │
        └──────────────────┘  └─────────────┘   └────────────────┘
```

---

## 🗂️ Directory Structure

```
edgars-store/
│
├── app/                           # Next.js App Router
│   ├── page.tsx                  # Home page
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles & theme
│   ├── middleware.ts             # Auth middleware
│   │
│   ├── shop/                     # Shopping pages
│   │   ├── page.tsx              # Product catalog
│   │   └── [id]/
│   │       └── page.tsx          # Product details
│   │
│   ├── cart/
│   │   └── page.tsx              # Shopping cart
│   │
│   ├── checkout/
│   │   └── page.tsx              # Checkout process
│   │
│   ├── orders/
│   │   └── page.tsx              # Order history
│   │
│   ├── admin/
│   │   └── page.tsx              # Admin dashboard
│   │
│   └── auth/                     # Authentication
│       ├── login/page.tsx
│       ├── signup/page.tsx
│       ├── callback/route.ts
│       ├── error/page.tsx
│       └── auth-code-error/page.tsx
│
├── components/                    # Reusable components
│   ├── Navigation.tsx            # Header/nav bar
│   ├── Footer.tsx                # Footer
│   ├── ProductCard.tsx           # Product card
│   └── ui/                       # shadcn/ui components
│       ├── button.tsx
│       ├── input.tsx
│       └── ...
│
├── lib/                          # Utilities & helpers
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   ├── server.ts             # Server Supabase client
│   │   └── middleware.ts         # Auth middleware utilities
│   └── utils.ts
│
├── public/                       # Static files
│   └── icon*.png
│
├── scripts/                      # Build & seed scripts
│   ├── 001_create_tables.sql    # Database schema
│   └── seed-products.js          # Populate with data
│
├── Documentation/
│   ├── README.md                 # Project overview
│   ├── SETUP.md                  # Setup guide
│   ├── IMPLEMENTATION.md         # Implementation details
│   ├── DEPLOYMENT.md             # Deploy instructions
│   ├── QUICK_REFERENCE.md        # Common tasks
│   ├── ARCHITECTURE.md           # This file
│   └── PROJECT_SUMMARY.md        # Executive summary
│
├── Configuration/
│   ├── package.json              # Dependencies
│   ├── tsconfig.json             # TypeScript config
│   ├── next.config.mjs           # Next.js config
│   ├── tailwind.config.ts        # Tailwind config
│   ├── postcss.config.js         # PostCSS config
│   └── .env.example              # Environment template
│
└── .gitignore                    # Git ignore rules
```

---

## 🔄 Data Flow Architecture

### Customer Journey

```
User arrives
    ↓
Visit /  (Home page)
    ↓
Browse /shop (Product catalog)
    ↓
Click product → /shop/[id]
    ↓
Add to cart → Saved in Supabase carts table
    ↓
View /cart → Load from Supabase
    ↓
Click checkout → /checkout
    ↓
Fill shipping info
    ↓
Place order → Saved to orders table
    ↓
View /orders → Load order history
```

### Authentication Flow

```
User visits /auth/signup
    ↓
Enters email + password
    ↓
Supabase.auth.signUp() called
    ↓
User metadata stored (full_name)
    ↓
Verification email sent
    ↓
User clicks email link → /auth/callback
    ↓
exchangeCodeForSession() called
    ↓
Session created
    ↓
Redirect to /shop
    ↓
User logged in!
```

### Admin Operations

```
Admin visits /admin
    ↓
Middleware checks user.role = 'admin'
    ↓
Dashboard loads
    ↓
Admin clicks "Add Product"
    ↓
Fills form + submits
    ↓
Supabase.from('products').insert()
    ↓
RLS policy checks: user role == 'admin'
    ↓
Product created or error returned
    ↓
List updates automatically
```

---

## 💾 Database Architecture

### Schema Design

```sql
-- Core Tables
products          (8 columns)  ← Public read, admin write
profiles          (5 columns)  ← User scoped
carts             (3 columns)  ← User scoped
orders            (8 columns)  ← User scoped
wishlists         (3 columns)  ← User scoped
tryon_results     (4 columns)  ← User scoped

-- RLS Policies
products:         1 read + 3 admin = 4 policies
profiles:         4 user scoped = 4 policies
carts:            4 user scoped = 4 policies
orders:           3 user scoped = 3 policies
wishlists:        4 user scoped = 4 policies
tryon_results:    2 user scoped = 2 policies

Total: 21 RLS policies for security
```

### Data Relationships

```
auth.users (Supabase)
    ↓
    ├── profiles (1:1)
    │   └── role: user | admin
    │
    ├── carts (1:1)
    │   └── items: CartItem[]
    │
    ├── orders (1:N)
    │   └── order_id: unique identifier
    │
    ├── wishlists (1:1)
    │   └── items: Product[]
    │
    └── tryon_results (1:N)
        └── product_id → products

products (Public)
    ├── id: UUID
    ├── name, price, stock
    ├── image_url
    └── used in: orders, carts, wishlists
```

---

## 🔐 Security Architecture

### Authentication Layer
```
Request → Middleware
    ↓
Check for valid session
    ↓
Refresh token if needed
    ↓
Add user to request context
    ↓
Allow/deny based on route
    ↓
Page/Component receives user
```

### Authorization Layer
```
Database Operation
    ↓
Check user authenticated
    ↓
Check RLS policy
    ↓
Extract user.id (auth.uid())
    ↓
Compare with row owner
    ↓
Allow operation or deny
```

### Input Validation
```
User Input
    ↓
Client-side validation (UX)
    ↓
Form submission
    ↓
Server receives data
    ↓
Server validates again
    ↓
Database operation
    ↓
Return result or error
```

---

## 🏗️ Component Architecture

### Page Component Pattern

```typescript
export default function FeaturePage() {
  const [state, setState] = useState()
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // Load data
  }, [])

  return (
    <div>
      <Navigation />
      <main>
        {/* Content */}
      </main>
      <Footer />
    </div>
  )
}
```

### Component Hierarchy

```
Root (layout.tsx)
├── Navigation (header)
├── Main Content
│   ├── Page components
│   │   ├── ProductCard (reusable)
│   │   ├── Button (shadcn/ui)
│   │   └── Input (shadcn/ui)
│   └── Dynamic content
└── Footer
```

---

## 🔄 State Management

### Where State Lives

```
Component State          → Local useState hooks
Server State            → Supabase queries + useState
User Auth              → Supabase.auth.getUser()
Cart Data              → Supabase carts table
Order History          → Supabase orders table
Product Catalog        → Supabase products table
Admin Data             → Protected routes + RLS
```

### State Update Flow

```
User Action (click, form submit)
    ↓
Update local state
    ↓
Call Supabase method
    ↓
Update database
    ↓
Return result
    ↓
Update UI state
    ↓
Re-render component
```

---

## 🎨 Styling Architecture

### Design System

```
Global Styles (globals.css)
    ├── CSS Variables (@theme)
    │   ├── Colors (primary, accent, etc.)
    │   ├── Typography (font families)
    │   └── Spacing & sizing
    │
    └── Tailwind CSS
        ├── Utility classes
        ├── Component classes
        └── Responsive prefixes

Component Styles
    ├── Inline classes (className)
    ├── Conditional classes (cn() utility)
    └── shadcn/ui components
```

### Color Theming

```
CSS Variables (in globals.css)
    ↓
Used in Tailwind @theme
    ↓
Classes like bg-primary, text-accent
    ↓
Applied in JSX className
    ↓
Rendered in browser
```

---

## 🚀 Performance Optimizations

### Code Splitting
```
Next.js automatically splits:
- Each page is own bundle
- Components lazy loaded
- Unused code not loaded
```

### Image Optimization
```
Next.js next/image provides:
- Automatic resizing
- Format optimization (webp)
- Lazy loading by default
- CDN integration
```

### Caching Strategy
```
Browser Cache      → Static assets (1 year)
Server Cache       → Supabase query results
API Cache          → Next.js ISR
Database Cache     → Query optimization
```

---

## 🧪 Testing Architecture

### Manual Testing Areas
```
Authentication
├── Signup flow
├── Email verification
├── Login
└── Logout

Shopping
├── Browse products
├── Filter/search
├── Add to cart
├── Update quantities
└── Remove items

Checkout
├── Fill shipping info
├── Select payment method
├── Place order
└── View confirmation

Admin
├── Login as admin
├── Create product
├── Edit product
└── Delete product
```

---

## 📈 Scalability Plan

### Current Capacity
```
Users/month:     1,000-10,000
Products:        100-1,000
Orders/month:    100-500
Database size:   < 1 GB
```

### Scale to 10x
```
Upgrade Supabase tier
Implement caching layer
Add database indexes
Optimize queries
Consider read replicas
```

### Scale to 100x
```
Multi-region setup
Dedicated database
Advanced caching
Image CDN
Load balancing
```

---

## 🔗 Integration Points

### Supabase Integration
```
// Authentication
supabase.auth.signUp()
supabase.auth.signInWithPassword()
supabase.auth.getUser()
supabase.auth.signOut()

// Database
supabase.from('table').select()
supabase.from('table').insert()
supabase.from('table').update()
supabase.from('table').delete()

// Real-time
supabase.on('postgres_changes', ...)
```

### Next.js Integration
```
// Server Components
async function getData() { ... }

// Client Components
'use client'

// Middleware
export function middleware(request) { ... }

// API Routes
export async function GET(request) { ... }
```

---

## 🎯 Design Patterns Used

### Pattern 1: Client Component with Effects
```typescript
'use client'
export default function Page() {
  const [state, setState] = useState()
  useEffect(() => { /* fetch */ }, [])
  return <div>{/* render */}</div>
}
```

### Pattern 2: Server Component with Query
```typescript
export default async function Page() {
  const data = await supabase.from('table').select()
  return <div>{/* render */}</div>
}
```

### Pattern 3: Protected Route
```typescript
// In middleware.ts
if (!user && isProtectedRoute) {
  return NextResponse.redirect('/auth/login')
}
```

### Pattern 4: Error Handling
```typescript
try {
  const { error } = await supabase.method()
  if (error) throw error
  setSuccess(true)
} catch (err) {
  setError(err.message)
}
```

---

## 📚 File Relationships

### Data Flow Files
```
app/page.tsx → Gets data from Supabase
app/shop/page.tsx → Queries products table
app/shop/[id]/page.tsx → Gets single product
app/cart/page.tsx → Queries user's cart
app/checkout/page.tsx → Creates order
app/orders/page.tsx → Queries user's orders
```

### Component Dependencies
```
Navigation.tsx → Needs user auth state
ProductCard.tsx → Receives product props
Footer.tsx → No dependencies
Page components → Depend on Supabase client
```

### Configuration Files
```
next.config.mjs → Build configuration
tsconfig.json → TypeScript settings
tailwind.config.ts → Tailwind configuration
package.json → Dependencies
.env.example → Environment template
```

---

## 🔄 Common Code Patterns

### Fetching Data
```typescript
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('category', category)
  .order('created_at', { ascending: false })

if (error) throw error
setData(data)
```

### Updating Data
```typescript
const { data, error } = await supabase
  .from('carts')
  .update({ items: updatedItems })
  .eq('user_id', user.id)

if (error) throw error
alert('Updated!')
```

### Checking Auth
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  router.push('/auth/login')
  return
}
```

---

## 🎓 Key Concepts

### Row-Level Security (RLS)
- Database-level access control
- Checks user role and ownership
- Prevents unauthorized data access
- Applied to all sensitive tables

### Client vs Server Components
- Client Components: Interactive UI, state, events
- Server Components: Data fetching, secure operations
- Middleware: Auth checks before request

### Session Management
- JWT tokens stored in HTTP-only cookies
- Automatic token refresh
- Secure and invisible to JS

### Type Safety
- TypeScript for all code
- Database types inferred from schema
- Component props fully typed

---

## 📊 Technology Stack Justification

| Technology | Why Used |
|-----------|----------|
| Next.js 15 | Latest React framework with SSR |
| React 19.2 | Modern UI library with hooks |
| TypeScript | Type safety and better DX |
| Supabase | Managed PostgreSQL + Auth |
| Tailwind CSS | Rapid UI development |
| shadcn/ui | Pre-built accessible components |

---

## 🚀 Deployment Architecture

```
Local Development
    ↓ (git push)
GitHub Repository
    ↓ (webhook)
Vercel Build
    ↓
Edge Network
    ↓
User Browser
```

---

## 📞 Architecture Support

For questions about:
- **Data flow**: Check PROJECT_SUMMARY.md
- **Database**: Check database schema in CREATE_TABLES.sql
- **Components**: Check component files for inline comments
- **Deployment**: Check DEPLOYMENT.md
- **Setup**: Check SETUP.md

---

**Architecture Version**: 1.0  
**Last Updated**: March 2024  
**Status**: Production Ready

This architecture is:
✅ Scalable - Can grow from 1 to 100,000+ users  
✅ Secure - RLS policies protect all data  
✅ Maintainable - Clear structure and patterns  
✅ Type-safe - Full TypeScript coverage  
✅ Performant - Optimized database queries  
