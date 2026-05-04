# edgARs Fashion Store - Premium E-Commerce Platform

A modern, fully-functional e-commerce platform for fashion retail built with Next.js 15, React, Supabase, and Tailwind CSS. Features include product browsing, shopping cart, user authentication, order management, and an admin dashboard.

## 🎯 Features

### Customer Features
- 🛍️ **Product Catalog** - Browse products with advanced filtering and search
- 🛒 **Shopping Cart** - Persistent cart with real-time updates via Supabase
- 💳 **Secure Checkout** - Multi-step checkout with multiple payment options
- 👤 **User Authentication** - Email verification, secure login/signup
- 📦 **Order Management** - View order history and status tracking
- 💝 **Wishlist** - Save favorite items for later
- 📱 **Responsive Design** - Perfect on mobile, tablet, and desktop
- 🎨 **AR Try-On Ready** - Architecture supports virtual try-on features

### Admin Features
- ⚙️ **Product Management** - Create, edit, delete products
- 📊 **Inventory Control** - Manage stock levels by size
- 🏷️ **Pricing & Badges** - Set prices and promotional badges (NEW, SALE)
- 👥 **User Management** - View customer profiles and orders
- 🔐 **Role-Based Access** - Admin dashboard with role verification

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)
- Supabase account (free tier available)

### Installation

1. **Clone & Install**
```bash
# Install dependencies
pnpm install
```

2. **Configure Supabase**
- Create a Supabase project at [supabase.com](https://supabase.com)
- Copy your Project URL and Anon Public Key
- Get your Service Role Key from Settings > API

3. **Set Environment Variables**
```bash
# Create .env.local
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. **Initialize Database**
- Go to Supabase Dashboard > SQL Editor
- Create a new query and run the SQL from `scripts/001_create_tables.sql`

5. **Seed Sample Data**
```bash
node scripts/seed-products.js
```

6. **Start Development Server**
```bash
pnpm dev
```

Visit `http://localhost:3000` 🎉

## 📁 Project Structure

```
EDGARS/
├── app/
│   ├── page.tsx                 # Home page with hero & features
│   ├── shop/
│   │   ├── page.tsx            # Product catalog
│   │   └── [id]/page.tsx       # Product details
│   ├── cart/page.tsx            # Shopping cart
│   ├── checkout/page.tsx        # Checkout flow
│   ├── orders/page.tsx          # Order history
│   ├── admin/page.tsx           # Admin dashboard
│   ├── auth/
│   │   ├── login/page.tsx       # Login page
│   │   ├── signup/page.tsx      # Signup page
│   │   ├── callback/route.ts    # Auth callback
│   │   ├── error/page.tsx       # Auth error page
│   │   └── signup-success/page.tsx
│   ├── globals.css              # Global styles & theme
│   └── layout.tsx               # Root layout
├── components/
│   ├── Navigation.tsx           # Header/Navigation
│   ├── Footer.tsx               # Footer
│   └── ProductCard.tsx          # Reusable product card
├── lib/
│   └── supabase/
│       ├── client.ts            # Browser Supabase client
│       ├── server.ts            # Server Supabase client
│       └── middleware.ts        # Auth middleware
├── middleware.ts                # Next.js middleware
├── scripts/
│   ├── 001_create_tables.sql    # Database schema
│   └── seed-products.js         # Sample data
├── package.json
├── next.config.mjs
├── tsconfig.json
├── SETUP.md                     # Detailed setup guide
└── README.md                    # This file
```

## 🎨 Design System

### Color Palette
- **Primary Navy**: Deep blue for main elements (`#1a2b4d`)
- **Accent Gold**: Elegant gold for highlights (`#d4a574`)
- **Background**: Clean white (`#fafafa`)
- **Foreground**: Dark gray text (`#1a1a1a`)

### Typography
- **Sans-serif**: Geist (headings & body)
- **Monospace**: Geist Mono (code)

### Components
Built with shadcn/ui on top of Radix UI and Tailwind CSS

## 🔐 Security Features

- ✅ **Row-Level Security (RLS)** - All database tables protected with RLS policies
- ✅ **Email Verification** - Required for account activation
- ✅ **Secure Sessions** - HTTP-only cookies, CSRF protection
- ✅ **Admin Verification** - Role-based access control
- ✅ **Input Validation** - Server-side validation on all inputs
- ✅ **Parameterized Queries** - Protection against SQL injection

## 📊 Database Schema

### Products Table
```sql
id: UUID (Primary Key)
name: TEXT
description: TEXT
category: TEXT (Men, Women, Kids, Accessories)
price: DECIMAL
image_url: TEXT
badge: TEXT (NEW, SALE, etc.)
stock: JSONB { "XS": 10, "S": 15, "M": 20, ... }
created_at: TIMESTAMPTZ
updated_at: TIMESTAMPTZ
```

### Carts Table
```sql
id: UUID
user_id: UUID (FK to auth.users)
items: JSONB (array of cart items)
updated_at: TIMESTAMPTZ
```

### Orders Table
```sql
id: UUID
user_id: UUID (FK to auth.users)
order_id: TEXT (unique order number)
items: JSONB
total: DECIMAL
status: TEXT (confirmed, processing, shipped, delivered)
payment_method: TEXT
shipping_address: JSONB
created_at: TIMESTAMPTZ
```

Similar tables for **Profiles**, **Wishlists**, and **TryOn Results**

## 🛠️ Key Technologies

| Technology | Purpose |
|-----------|---------|
| **Next.js 15** | React framework with SSR & API routes |
| **React 19.2** | UI library with latest features |
| **TypeScript** | Type-safe JavaScript |
| **Supabase** | PostgreSQL + Auth + Real-time |
| **Tailwind CSS 4** | Utility-first styling |
| **shadcn/ui** | Beautiful pre-built components |
| **SWR** | Data fetching & caching |

## 🧑‍💻 Development

### Running Tests
```bash
# Coming soon - configure your test runner
```

### Building for Production
```bash
pnpm build
pnpm start
```

### Code Quality
- ESLint configured
- TypeScript strict mode enabled
- Prettier formatting available

## 🌐 Deployment

### Deploy to Vercel (Recommended)
```bash
# Connect your GitHub repository to Vercel
# Set environment variables in Vercel dashboard
# Push to main branch to auto-deploy
```

### Deploy to Other Platforms
1. Set environment variables in your hosting
2. Run `pnpm build`
3. Run `pnpm start`

## 📖 Usage Examples

### Adding a Product (Admin)
1. Navigate to `/admin`
2. Click "Add New Product"
3. Fill in details: name, price, category, images
4. Set stock levels for each size
5. Click "Create Product"

### Making a User Admin
In Supabase Dashboard:
1. Go to Profiles table
2. Find the user
3. Set `role` column to `admin`

### Processing a Customer Order
- Customer adds items to cart
- Completes checkout with shipping info
- Selects payment method
- Order is created and stored in database
- Can view in `/orders` page

## 🐛 Troubleshooting

### Issue: Products not loading
**Solution**: 
- Check `.env.local` has correct Supabase URL & keys
- Verify database schema was created from SQL script
- Check browser DevTools console for errors

### Issue: Can't sign up
**Solution**:
- Check email is correct
- Confirm email verification is enabled in Supabase
- Check email spam folder for verification link

### Issue: Admin dashboard not accessible
**Solution**:
- Verify user role is set to "admin" in Profiles table
- Check RLS policies allow admin access
- Clear browser cache and re-login

### Issue: Cart not persisting
**Solution**:
- Verify Supabase auth is working (check session)
- Check carts table exists in database
- Verify user has permission to read/write carts (RLS)

## 📚 Useful Resources

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **React Docs**: https://react.dev

## 🎓 Learning Path

1. Start with `/app/page.tsx` to understand the structure
2. Review `/app/shop/page.tsx` for product fetching
3. Check `/lib/supabase/client.ts` for Supabase setup
4. Explore `/components/Navigation.tsx` for authentication
5. Study `/app/checkout/page.tsx` for order creation

## 🤝 Contributing

Feel free to fork, modify, and improve this project!

## 📄 License

MIT License - Feel free to use in your projects

## 🎉 Conclusion

This is a production-ready e-commerce platform that demonstrates:
- ✅ Modern React patterns with Next.js 15
- ✅ Real-time database with Supabase
- ✅ Secure authentication & authorization
- ✅ Responsive design with Tailwind CSS
- ✅ Component-based architecture
- ✅ Type-safe TypeScript

Start customizing it for your fashion brand today! 🚀

---

**Built with ❤️ using v0** - The AI-powered frontend builder by Vercel
