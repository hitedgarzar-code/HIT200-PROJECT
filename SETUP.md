# EDGARS Clothing Store - Setup Instructions

A modern, elegant e-commerce platform for fashion retail with AR try-on capabilities and Supabase backend integration.

## Features

✨ **Core Features:**
- **Premium Product Catalog** - Browse and filter clothing by category
- **Shopping Cart & Checkout** - Full cart management with real-time updates
- **User Authentication** - Secure signup and login with Supabase Auth
- **Order Management** - Track and view all your orders
- **Admin Dashboard** - Manage products, stock, and pricing
- **Elegant Design** - Sophisticated UI with navy and gold color scheme
- **Mobile Responsive** - Perfect shopping experience on any device
- **Multiple Payment Methods** - Card, bank transfer, and mobile wallet options

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS v4 with custom design tokens
- **Backend**: Supabase (PostgreSQL + Auth)
- **Database**: PostgreSQL with Row-Level Security
- **Components**: shadcn/ui

## Database Schema

### Tables:
- **products** - Fashion items with pricing and stock
- **profiles** - Extended user information
- **carts** - User shopping carts
- **orders** - Order history and status
- **wishlists** - Saved favorite items
- **tryon_results** - AR try-on results

All tables have Row-Level Security (RLS) enabled for data protection.

## Setup Steps

### 1. Clone and Install Dependencies

```bash
# Install packages
pnpm install
```

### 2. Configure Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the Supabase dashboard, go to **Settings > API**
3. Copy your `Project URL` and `anon public key`

### 3. Set Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Get the service role key from Supabase dashboard > Settings > API > Service role key

### 4. Create Database Schema

1. Go to Supabase dashboard > SQL Editor
2. Click "New Query"
3. Copy and paste the contents of `/scripts/001_create_tables.sql`
4. Click "Run"

### 5. Seed Sample Products

```bash
# This will populate the database with sample products
node scripts/seed-products.js
```

## Running the Application

```bash
# Development server
pnpm dev

# Open http://localhost:3000 in your browser
```

## User Roles

### Customer
- Browse and search products
- Add items to cart
- Checkout and place orders
- View order history
- Manage profile

### Admin
- Access admin dashboard at `/admin`
- Create, edit, delete products
- Manage inventory and pricing
- Set product badges (NEW, SALE)

**Note:** To make a user an admin, update their profile in the Supabase dashboard:
1. Go to Profiles table
2. Find the user
3. Set `role` to `admin`

## Key Pages

- `/` - Home page with featured products
- `/shop` - Product catalog with filters
- `/shop/[id]` - Product detail page
- `/cart` - Shopping cart
- `/checkout` - Checkout page
- `/orders` - Order history
- `/auth/login` - Login page
- `/auth/signup` - Sign up page
- `/admin` - Admin dashboard (admin only)

## API Routes

Products are managed directly through Supabase with RLS policies:
- **GET** `/products` - List all products
- **POST** `/products` - Create product (admin only)
- **UPDATE** `/products/[id]` - Update product (admin only)
- **DELETE** `/products/[id]` - Delete product (admin only)

Carts, Orders, and Wishlists use user-scoped RLS policies.

## Color Scheme

- **Primary Navy**: `oklch(0.2 0.04 240)` - `#1a2b4d`
- **Accent Gold**: `oklch(0.65 0.12 50)` - `#d4a574`
- **Background**: `oklch(0.98 0.002 0)` - `#fafafa`
- **Foreground**: `oklch(0.15 0.01 240)` - `#1a1a1a`

## Security Features

- ✅ Row-Level Security (RLS) on all tables
- ✅ Email verification for user signup
- ✅ Secure session management
- ✅ Admin role verification
- ✅ HTTPS-only cookies
- ✅ Parameterized queries (no SQL injection)

## File Structure

```
app/
├── page.tsx              # Home page
├── shop/
│   ├── page.tsx          # Shop listing
│   └── [id]/page.tsx     # Product details
├── cart/page.tsx         # Shopping cart
├── checkout/page.tsx     # Checkout
├── orders/page.tsx       # Order history
├── auth/
│   ├── login/page.tsx    # Login
│   ├── signup/page.tsx   # Signup
│   └── signup-success/   # Signup confirmation
└── admin/page.tsx        # Admin dashboard

components/
├── Navigation.tsx        # Navigation bar
├── Footer.tsx           # Footer
└── ProductCard.tsx      # Product card component

lib/supabase/
├── client.ts            # Supabase browser client
├── server.ts            # Supabase server client
└── middleware.ts        # Auth middleware utilities

scripts/
├── 001_create_tables.sql # Database schema
└── seed-products.js     # Sample data
```

## Customization

### Update Brand Colors

Edit `/app/globals.css` and modify the color variables in `:root`:

```css
:root {
  --primary: oklch(0.2 0.04 240);      /* Your primary color */
  --accent: oklch(0.65 0.12 50);       /* Your accent color */
  /* ... other colors */
}
```

### Add New Product Categories

Edit `/app/shop/page.tsx` and add to `CATEGORIES`:

```tsx
const CATEGORIES = ['All', 'Men', 'Women', 'Kids', 'YourCategory']
```

### Customize Product Fields

Modify the product interface in `/app/shop/[id]/page.tsx` and the database schema.

## Deployment

### Vercel (Recommended)

```bash
# Push to GitHub
git push origin main

# Connect repository to Vercel dashboard
# Environment variables are automatically set from project settings
```

### Other Platforms

1. Set environment variables in your hosting platform
2. Run `pnpm build` to create production bundle
3. Run `pnpm start` to serve the application

## Troubleshooting

### Products not loading?
- Check Supabase URL and keys in `.env.local`
- Verify database schema was created
- Check browser console for errors

### Authentication not working?
- Confirm email verification is enabled in Supabase
- Check that auth domain matches your deployment URL
- Verify JWT tokens in browser console

### Admin features not accessible?
- Ensure user role is set to "admin" in Supabase
- Verify RLS policies allow admin access
- Check middleware authentication

## Support

For issues with:
- **Supabase**: Visit [supabase.com/docs](https://supabase.com/docs)
- **Next.js**: Visit [nextjs.org/docs](https://nextjs.org/docs)
- **Tailwind CSS**: Visit [tailwindcss.com/docs](https://tailwindcss.com/docs)

## License

This project is open source and available under the MIT License.

---

**Made with ❤️ using v0** - The frontend AI generation platform by Vercel
