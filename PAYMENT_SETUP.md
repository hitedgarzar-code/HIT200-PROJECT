# Payment Setup Guide

This guide will help you set up PayNow and Pay Later payments for your EDGARS clothing store.

## Quick Start (5 minutes)

### Step 1: Get PayNow Credentials

1. Visit https://www.paynow.co.zw/register
2. Sign up for a merchant account
3. Complete business verification
4. Once approved, go to your dashboard
5. Copy your:
   - **Integration ID**
   - **Integration Key** (keep this secret!)
   - **Callback URL**: `https://yourdomain.com/api/payments/paynow/callback`

### Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env.local`
2. Fill in the variables:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# PayNow
NEXT_PUBLIC_PAYNOW_INTEGRATION_ID=your_integration_id
PAYNOW_INTEGRATION_KEY=your_secret_key
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

### Step 3: Run Database Migrations

The database tables are already created by the migration script:

```sql
-- These tables will be created:
- paynow_transactions    # Tracks all PayNow payments
- pay_later_plans        # Stores instalment plans
- pay_later_installments # Individual instalment records
```

To manually execute migrations:

```bash
# Option 1: Using Supabase CLI
supabase db push

# Option 2: In Supabase Dashboard
# Go to SQL Editor → Run the scripts from scripts/ folder
```

### Step 4: Test the Integration

**Test PayNow:**
1. Go to `/shop` and add items to cart
2. Click checkout
3. Fill in all required fields
4. Select "PayNow - Instant Payment"
5. Use test phone number: `+263712345678`
6. Click "Pay with PayNow"
7. System will simulate payment confirmation

**Test Pay Later:**
1. Go back to checkout
2. Select "Pay Later - Flexible Plans"
3. Choose 3, 6, or 12 months
4. System will create instalment plan
5. View the schedule at `/pay-later/[planId]`

### Step 5: Deploy to Production

#### For Vercel Deployment:

1. Push code to GitHub
2. Go to vercel.com → Import project
3. In Settings → Environment Variables, add:
   - `NEXT_PUBLIC_PAYNOW_INTEGRATION_ID`
   - `PAYNOW_INTEGRATION_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy!

#### For PayNow Configuration:

1. Log in to PayNow merchant dashboard
2. Go to Integration Settings
3. Update Callback URL to: `https://yourdomain.com/api/payments/paynow/callback`
4. Enable production mode
5. Test with production credentials

---

## Features Overview

### PayNow (Instant Payment)

**What customers see:**
- Mobile payment option at checkout
- Enter phone number linked to wallet
- Receive USSD code on phone
- Complete payment in 30 seconds
- Order immediately confirmed

**Supported wallets:**
- EcoCash (Econet)
- OneMoney (Telecel)
- InnBucks (Innscor)
- Credit/Debit Cards

**Transaction flow:**
```
Checkout → Select PayNow → Enter Details → Polling → Payment Confirmed → Order Created
```

### Pay Later (Flexible Instalments)

**What customers see:**
- 3 instalment plan options
- Clear breakdown of monthly payments
- First payment due in 30 days
- View payment schedule anytime
- Get reminders before due dates

**Plan options:**
- **3 Months**: 5% interest
- **6 Months**: 8% interest
- **12 Months**: 12% interest

**Example: ZWL 6,000 order**

| Plan | Monthly | Total | Interest |
|------|---------|-------|----------|
| 3 months | ZWL 2,100 | ZWL 6,300 | ZWL 300 |
| 6 months | ZWL 1,080 | ZWL 6,480 | ZWL 480 |
| 12 months | ZWL 560 | ZWL 6,720 | ZWL 720 |

---

## Customization

### Change Interest Rates

Edit `lib/paylater.ts`:

```typescript
const interestRates = {
  3: 0.05,   // Change 0.05 (5%) to your preferred rate
  6: 0.08,   // Change 0.08 (8%) to your preferred rate
  12: 0.12,  // Change 0.12 (12%) to your preferred rate
}
```

### Change Shipping Thresholds

Edit `app/checkout/page.tsx`:

```typescript
const shipping = subtotal > 500 ? 0 : 50  // Free shipping over 500 ZWL
// Change 500 and 50 to your thresholds
```

### Customize Payment Methods

To add more payment methods, edit `app/checkout/page.tsx`:

```typescript
// Add new payment option in the payment selection UI
<div className="p-6 rounded-lg border-2">
  {/* Your custom payment method UI */}
</div>
```

---

## Testing Scenarios

### Scenario 1: Successful PayNow Payment

1. Add item to cart (e.g., T-shirt ZWL 500)
2. Go to checkout
3. Fill in address details
4. Click "Continue to Payment"
5. Select "PayNow - Instant Payment"
6. Enter phone: `+263712345678`
7. Enter email: `test@example.com`
8. Click "Pay with PayNow"
9. **Expected**: Order created, payment processing shown

### Scenario 2: Pay Later Plan

1. Add item to cart (e.g., Jeans ZWL 2,500)
2. Go to checkout
3. Fill in address details
4. Click "Continue to Payment"
5. Select "Pay Later - Flexible Plans"
6. Click "6 Month Plan"
7. System shows monthly payment: ZWL 450
8. Click "Select Plan"
9. **Expected**: Plan created, order confirmed

### Scenario 3: View Order with PayNow

1. Go to Orders page
2. Click recent order with PayNow
3. **Expected**: Shows "PayNow Instant Payment" badge
4. Shows payment status: "paid" or "pending"

### Scenario 4: View Order with Pay Later

1. Go to Orders page
2. Click recent order with Pay Later
3. **Expected**: Shows "Pay Later Instalment Plan" badge
4. Shows instalment info and link to schedule
5. Click "View Instalment Schedule"
6. **Expected**: See all payment dates and amounts

---

## Troubleshooting

### Problem: "Missing PayNow credentials"

**Solution:**
1. Check `.env.local` file exists
2. Verify `NEXT_PUBLIC_PAYNOW_INTEGRATION_ID` is set
3. Verify `PAYNOW_INTEGRATION_KEY` is set
4. Restart dev server: `pnpm dev`

### Problem: "Payment tables not found"

**Solution:**
1. Run database migration: `/scripts/003_paynow_paylater.sql`
2. Check Supabase dashboard for tables
3. Verify RLS policies are enabled

### Problem: "PayNow reference not decoding"

**Solution:**
1. Check token format in polling URL
2. Verify base64 encoding in `lib/paynow.ts`
3. Check browser console for errors

### Problem: "Pay Later plan creation fails"

**Solution:**
1. Verify order exists in database
2. Check order belongs to current user
3. Verify amount is positive
4. Check months is 3, 6, or 12
5. Review server logs for RLS errors

---

## Performance Optimization

### PayNow Polling

Currently polls every 5 seconds for up to 5 minutes (300 seconds):

```typescript
// In PayNowPayment.tsx
const maxAttempts = 60  // 60 attempts
setTimeout(poll, 5000)  // 5 second interval
```

Adjust for your needs:
```typescript
const maxAttempts = 120  // 10 minutes
setTimeout(poll, 2000)   // 2 second interval
```

### Database Indexes

For production, add indexes:

```sql
CREATE INDEX idx_paynow_user_id ON paynow_transactions(user_id);
CREATE INDEX idx_paylater_user_id ON pay_later_plans(user_id);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
```

---

## Security Checklist

- [ ] PayNow keys stored in environment variables (never hardcoded)
- [ ] HTTPS enabled on production domain
- [ ] Webhook signature verification implemented
- [ ] Row Level Security enabled on all tables
- [ ] Payment references validated before processing
- [ ] Rate limiting on payment endpoints
- [ ] Sensitive data never logged
- [ ] CORS properly configured
- [ ] Payment data encrypted at rest

---

## Support

For issues with:
- **PayNow integration**: Contact PayNow support at support@paynow.co.zw
- **This application**: Check server logs and browser console
- **Supabase database**: Visit supabase.com/support

---

## Next Steps

1. ✅ Set up environment variables
2. ✅ Run database migrations
3. ✅ Test both payment methods locally
4. ✅ Configure PayNow callback URL
5. ✅ Deploy to production
6. ✅ Monitor first payments
7. ✅ Set up customer support documentation
