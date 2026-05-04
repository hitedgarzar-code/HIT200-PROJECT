# Quick Start: PayNow & Pay Later Payments

Get your payment system running in **5 minutes**.

---

## 1️⃣ Configure Environment Variables (2 min)

**Step 1:** Create `.env.local` file in project root:

```bash
cd /vercel/share/v0-project
cp .env.example .env.local
```

**Step 2:** Edit `.env.local`:

```env
# Supabase (get from Supabase dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# PayNow (get from PayNow merchant dashboard)
NEXT_PUBLIC_PAYNOW_INTEGRATION_ID=your_integration_id_here
PAYNOW_INTEGRATION_KEY=your_secret_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 2️⃣ Run Database Migrations (1 min)

**In Supabase Dashboard:**

1. Go to SQL Editor
2. Copy entire content of `scripts/003_paynow_paylater.sql`
3. Paste and execute
4. ✅ Tables created!

---

## 3️⃣ Start Development Server (1 min)

```bash
pnpm install  # Install any new dependencies
pnpm dev      # Start server
```

**Expected:** Server running at http://localhost:3000

---

## 4️⃣ Test the System (1 min)

### Test PayNow

```
1. Go to http://localhost:3000/shop
2. Add item to cart
3. Go to checkout
4. Fill address, click "Continue to Payment"
5. Select "PayNow - Instant Payment"
6. Enter phone: +263712345678
7. Click "Pay with PayNow"
8. See payment processing...
✅ Working!
```

### Test Pay Later

```
1. Go to http://localhost:3000/shop
2. Add different item to cart
3. Go to checkout
4. Fill address, click "Continue to Payment"
5. Select "Pay Later - Flexible Plans"
6. Click on "6 Month Plan"
7. See plan created...
8. Go to /orders to see it
✅ Working!
```

---

## 📚 Next Steps

### For Development
- Read `PAYMENT_SETUP.md` for detailed setup
- Read `PAYNOW_PAYLATER_GUIDE.md` for technical details
- Check `VERIFY_INSTALLATION.md` to verify everything

### For Production
1. Get PayNow merchant credentials
2. Update environment variables
3. Set callback URL in PayNow dashboard
4. Deploy to production
5. Monitor first payments

### For Customization
- Change interest rates in `lib/paylater.ts`
- Modify component styling in `components/PayNow*.tsx`
- Adjust checkout flow in `app/checkout/page.tsx`

---

## 🆘 Troubleshooting

### Can't connect to Supabase?
```bash
# Check .env.local has correct URLs
grep SUPABASE .env.local
# Values should match your Supabase dashboard
```

### Components not showing?
```bash
# Restart dev server
# Close: Ctrl+C
# Restart: pnpm dev
```

### Database tables not found?
```bash
# In Supabase SQL Editor:
SELECT * FROM paynow_transactions;
# If error, run: scripts/003_paynow_paylater.sql
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `lib/paynow.ts` | PayNow logic |
| `lib/paylater.ts` | Pay Later logic |
| `components/PayNowPayment.tsx` | PayNow UI |
| `components/PayLaterPlans.tsx` | Pay Later UI |
| `app/checkout/page.tsx` | Checkout page |
| `app/orders/page.tsx` | Orders listing |
| `app/pay-later/[planId]/page.tsx` | Schedule page |

---

## ✨ That's It!

Your payment system is now:
- ✅ Installed
- ✅ Configured
- ✅ Tested
- ✅ Ready to use

**Happy selling!** 🎉

---

**Need more help?** Open `PAYMENT_SETUP.md`
