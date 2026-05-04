# Quick Deployment Guide - edgARs v1.0.0

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
pnpm install
```

### Step 2: Setup Environment
Create `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Create Admin & Sample Data
```bash
node scripts/setup-admin.js
```

Output will show:
```
✅ Admin user created successfully!
   Email: admin@edgars.com
   Password: AdminEdgars2024!
   ⚠️  Please change this password after first login!

✅ 17 products inserted successfully!
```

### Step 4: Run Development Server
```bash
pnpm dev
```

Visit: `http://localhost:3000`

---

## 📋 First-Time Checklist

- [ ] Database connected (Supabase)
- [ ] Setup script executed
- [ ] Admin user created
- [ ] Sample products inserted
- [ ] Dev server running
- [ ] Home page loads
- [ ] Splash screen plays (20 seconds)
- [ ] Login page accessible
- [ ] Admin dashboard works

---

## 🔑 Default Credentials

```
Admin Email: admin@edgars.com
Admin Password: AdminEdgars2024!
```

**⚠️ Change this immediately after first login!**

---

## 🛒 Testing the Store

### Customer Flow
1. Visit homepage → See splash screen (20 sec)
2. Browse products at `/shop`
3. Click product → See details
4. Add to cart
5. Go to `/cart`
6. Click Checkout
7. Redirects to `/auth/login` (not logged in)
8. Create account or login
9. Return to checkout
10. Fill shipping info
11. Choose PayNow or PayLater
12. Process payment
13. View order at `/orders`
14. Print receipt

### Admin Flow
1. Visit `/admin`
2. Login with admin@edgars.com
3. View dashboard stats
4. See payment logs
5. Manage products (CRUD)
6. Logout

---

## 🎨 Key Features to Test

| Feature | URL | Expected |
|---------|-----|----------|
| Homepage | `/` | Splash (20s) then home |
| Shop | `/shop` | Product catalog |
| Product | `/shop/[id]` | Details + sizes |
| Cart | `/cart` | Requires login |
| Checkout | `/checkout` | Requires login |
| Orders | `/orders` | Order history |
| Admin | `/admin` | Dashboard |

---

## 🔐 Security Setup

1. **Change Admin Password**
   ```
   Admin dashboard → Account settings → Change password
   ```

2. **Enable Supabase RLS**
   ```
   Check Supabase dashboard → SQL policies enabled
   ```

3. **Set Production URL**
   ```env
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

---

## 💳 Payment Testing

### PayNow Flow
1. Add items to cart
2. Checkout
3. Select PayNow
4. Enter phone number
5. Confirm payment
6. Check payment logs in admin

### PayLater Flow
1. Add items to cart
2. Checkout
3. Select Pay Later
4. Choose plan (3/6/12 months)
5. First payment in 30 days
6. Check plan at `/pay-later/[planId]`

---

## 📊 Admin Dashboard Tabs

### Overview
- **Total Orders**: Count of all orders
- **Total Revenue**: Sum of all payments (ZWL)
- **Total Customers**: Count of users
- **Pending Payments**: Orders awaiting payment

### Products
- Add new product
- Edit existing product
- Delete product
- View product grid

### Payments
- View all transactions
- Search by customer/order/transaction ID
- Filter by status
- See date & time
- Track PayNow and PayLater payments

---

## 🐛 Troubleshooting

### Database Connection Error
```
Check:
- Supabase URL correct
- Anon key correct
- Network connection
- Supabase project active
```

### Admin Login Fails
```
Check:
- Email is exactly: admin@edgars.com
- Password is correct
- Email confirmed in Supabase
- Not banned/suspended
```

### Splash Screen Not Showing
```
Check:
- Framer Motion installed (pnpm install)
- SplashProvider in layout.tsx
- Browser allows animations
- No JavaScript errors (F12)
```

### Products Not Showing
```
Run setup script again:
node scripts/setup-admin.js
```

### Payment Logs Empty
```
Check:
- Orders exist in database
- Payment method recorded
- Click Refresh button
- Check date range
```

---

## 📱 Mobile Testing

The app is fully responsive. Test on:
- iPhone 12/13/14/15
- Android (Samsung, Pixel)
- iPad
- Desktop (1920x1080)

All features work on mobile, including:
- Checkout
- Payment
- Receipt printing
- Admin (touch-friendly)

---

## 📈 Deployment Steps

### To Vercel
```bash
# Connect GitHub repo
# Push code to GitHub
# Import to Vercel
# Set environment variables
# Deploy
```

### To Other Hosts
1. Build project: `pnpm build`
2. Install Node.js 18+
3. Copy `.env.local` to server
4. Run: `pnpm start`
5. Setup reverse proxy (Nginx/Apache)
6. Enable HTTPS (Let's Encrypt)

---

## 🔍 What to Check Before Going Live

- [ ] Admin password changed
- [ ] All products have images
- [ ] Pricing in local currency (ZWL)
- [ ] PayNow credentials set (if using real API)
- [ ] Email notifications configured
- [ ] HTTPS enabled
- [ ] Database backups enabled
- [ ] Analytics setup
- [ ] Error logging enabled
- [ ] Monitoring active

---

## 📞 Support URLs

- **Admin Help**: Read `ADMIN_SETUP_GUIDE.md`
- **Payment Help**: Read `PAYNOW_PAYLATER_GUIDE.md`
- **Full Docs**: Read `FINAL_IMPLEMENTATION_COMPLETE.md`
- **Architecture**: Read `ARCHITECTURE.md`

---

## ⚡ Performance Tips

1. **Compress images** before uploading
2. **Use CDN** for product images
3. **Enable caching** on Supabase
4. **Monitor database** performance
5. **Test payment** integration thoroughly
6. **Optimize** database queries
7. **Use analytics** to track usage

---

## 🎯 Next Steps After Deployment

1. **Week 1**: Monitor for errors
2. **Week 2**: Gather user feedback
3. **Week 3**: Optimize based on feedback
4. **Week 4**: Plan next features

---

## 📦 What's Included

✅ Complete e-commerce platform  
✅ Admin dashboard  
✅ PayNow integration  
✅ Pay Later instalment plans  
✅ Receipt generation  
✅ Sample products  
✅ Beautiful UI  
✅ Mobile responsive  
✅ Secure authentication  
✅ Complete documentation  

---

## 🎉 You're Ready!

**edgARs is ready to launch!**

```bash
pnpm dev        # Start development
pnpm build      # Build for production
pnpm start      # Run production
```

---

**Last Updated**: March 2026  
**Platform**: edgARs v1.0.0  
**Status**: ✅ Ready to Deploy
