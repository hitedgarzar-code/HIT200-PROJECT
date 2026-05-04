# EDGARS Store - Quick Reference Guide

## 🚀 Common Tasks

### Add a New Product
```typescript
// 1. Go to /admin
// 2. Click "Add New Product"
// 3. Fill form with:
//    - Name: "Premium Jacket"
//    - Category: "Men"
//    - Price: "99.99"
//    - Image URL: "https://..."
//    - Stock: XS=10, S=15, M=20, etc.
// 4. Click "Create Product"
```

### Make a User Admin
**In Supabase Dashboard:**
1. Go to your project
2. Navigate to "Profiles" table
3. Find the user
4. Change `role` column from `user` to `admin`
5. Click "Save"

The user can now access `/admin`

### Update Product Stock
1. Go to `/admin`
2. Find the product
3. Click "Edit"
4. Update quantities for each size
5. Click "Update Product"

### View Customer Orders
1. Go to `/orders` (as logged-in customer)
2. See all past orders with details
3. Check order ID, date, total, items

### Check Server Logs
```bash
# During development
pnpm dev
# Logs appear in terminal

# In production
# Check your hosting provider's logs
# (Vercel Dashboard > Logs for Vercel deployments)
```

## 📝 Environment Variables

```env
# Required - Get from Supabase Dashboard
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🗄️ Database Quick Reference

### Check Products
```sql
-- Supabase SQL Editor
SELECT id, name, category, price, stock 
FROM products 
ORDER BY created_at DESC
LIMIT 10;
```

### Check Orders
```sql
SELECT order_id, user_id, total, status, created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;
```

### Check User Profiles
```sql
SELECT id, full_name, email, role
FROM profiles
ORDER BY created_at DESC;
```

### View Cart Items
```sql
SELECT user_id, items
FROM carts
WHERE items != '[]'
ORDER BY updated_at DESC;
```

## 🔐 User Roles

### Customer (Default)
```
Can access:
✓ /
✓ /shop
✓ /shop/[id]
✓ /cart
✓ /checkout
✓ /orders
✓ /auth/login
✓ /auth/signup
```

### Admin
```
Can access:
✓ Everything customer can access
✓ /admin (Product management)
✓ (Optional) Order management features
```

## 📱 Key Endpoints & Routes

| Route | Purpose | Auth | Role |
|-------|---------|------|------|
| `/` | Home | No | All |
| `/shop` | Catalog | No | All |
| `/shop/[id]` | Product Details | No | All |
| `/cart` | Shopping Cart | Yes | Customer |
| `/checkout` | Checkout | Yes | Customer |
| `/orders` | Order History | Yes | Customer |
| `/admin` | Dashboard | Yes | Admin |
| `/auth/login` | Login | No | Visitors |
| `/auth/signup` | Sign Up | No | Visitors |

## 🎨 Styling Quick Reference

### Update Primary Color
Edit `/app/globals.css`:
```css
:root {
  --primary: oklch(0.2 0.04 240);  /* Change this */
}
```

### Add New Tailwind Classes
Use Tailwind utilities directly in JSX:
```jsx
<div className="bg-primary text-white px-4 py-2 rounded-lg">
  Content
</div>
```

### Common Classes
- `bg-primary` - Primary blue background
- `text-accent` - Accent gold text
- `bg-card` - Card/container background
- `text-muted-foreground` - Subtle gray text
- `rounded-lg` - Rounded corners
- `shadow-md` - Medium shadow

## 🐛 Debugging Tips

### Check Supabase Connection
```typescript
// In browser console
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
const { data } = await supabase.from('products').select('count')
console.log(data) // Should show count
```

### View Auth Session
```typescript
// In browser console
const supabase = createClient()
const { data } = await supabase.auth.getSession()
console.log(data.session)
```

### Check User Role
```typescript
// In browser console
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()
console.log(profile.role)
```

## 📊 Data Models

### Product
```typescript
{
  id: string
  name: string
  description: string
  category: 'Men' | 'Women' | 'Kids' | 'Accessories'
  price: number
  image_url: string
  badge?: 'NEW' | 'SALE' | string
  stock: { XS: 10, S: 15, M: 20, L: 18, XL: 12, XXL: 8 }
  created_at: string
}
```

### CartItem
```typescript
{
  product_id: string
  name: string
  price: number
  size: string  // XS, S, M, L, XL, XXL
  quantity: number
  image_url: string
}
```

### Order
```typescript
{
  id: string
  order_id: string  // ORD-1234567890
  user_id: string
  items: CartItem[]
  total: number
  status: 'confirmed' | 'processing' | 'shipped' | 'delivered'
  payment_method: 'card' | 'bank' | 'mobile'
  shipping_address: {
    fullName: string
    address: string
    city: string
    zipCode: string
    email: string
  }
  created_at: string
}
```

## 🔗 Important Links

- **Live App**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin
- **Supabase Dashboard**: https://app.supabase.com
- **Vercel Deploy**: https://vercel.com/new
- **Tailwind Docs**: https://tailwindcss.com
- **Next.js Docs**: https://nextjs.org/docs

## 📋 Checklist for New Feature

When adding a new feature:
- [ ] Create database table/schema if needed
- [ ] Add RLS policies for security
- [ ] Create React component
- [ ] Add TypeScript types
- [ ] Test with real data
- [ ] Add error handling
- [ ] Test on mobile
- [ ] Update documentation
- [ ] Deploy and verify

## 🆘 Common Errors & Solutions

### "NEXT_PUBLIC_SUPABASE_URL is not set"
**Solution**: Add environment variables to `.env.local`

### "User doesn't exist"
**Solution**: User hasn't verified email or signup failed. Check Supabase Auth users table.

### "Cart is empty" on checkout
**Solution**: User needs to be logged in. Check session with `getUser()`

### "Permission denied" on insert
**Solution**: Check RLS policies. User might not have permission. Verify user_id matches auth.uid()

### Products not showing
**Solution**: 
1. Check products table exists
2. Verify data was seeded: `SELECT COUNT(*) FROM products`
3. Check browser DevTools Network tab

### Admin page shows "Not found"
**Solution**: 
1. Verify user role is "admin" in profiles table
2. Ensure user is logged in
3. Clear browser cache

## 📞 Support Resources

- Supabase Community: https://discord.supabase.com
- Next.js Discord: https://discord.gg/nextjs
- v0 Community: https://v0.dev
- Stack Overflow: Tag with `next.js` and `supabase`

## 🎯 Performance Tips

1. **Optimize Images**: Use next/image for automatic optimization
2. **Cache Data**: SWR automatically caches API responses
3. **Lazy Load**: Use dynamic imports for heavy components
4. **Code Splitting**: Next.js handles this automatically
5. **Monitor**: Check Vercel Analytics for performance

## 💾 Backup & Maintenance

### Backup Database
```bash
# Use Supabase Dashboard > Backups
# Or export data as SQL
```

### Clear Cache
```bash
# Remove .next build folder
rm -rf .next

# Rebuild
pnpm build
```

### Update Dependencies
```bash
# Check for outdated packages
pnpm outdated

# Update all
pnpm upgrade
```

---

**Last Updated**: March 2024  
**Version**: 1.0.0

For detailed information, see README.md, SETUP.md, or IMPLEMENTATION.md
