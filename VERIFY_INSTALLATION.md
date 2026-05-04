# Verify PayNow & Pay Later Installation

This checklist confirms that all PayNow and Pay Later features have been properly installed.

---

## ✅ File Verification

### Core Libraries
- [ ] `lib/paynow.ts` exists (242 lines)
- [ ] `lib/paylater.ts` exists (265 lines)
- [ ] Both files have proper TypeScript types

**Command to check:**
```bash
ls -la lib/paynow.ts lib/paylater.ts
```

### UI Components
- [ ] `components/PayNowPayment.tsx` exists (185 lines)
- [ ] `components/PayLaterPlans.tsx` exists (149 lines)
- [ ] Both components render without errors

**Command to check:**
```bash
ls -la components/Payment*.tsx
```

### API Routes
- [ ] `app/api/payments/paynow/initiate/route.ts` exists
- [ ] `app/api/payments/paynow/poll/route.ts` exists
- [ ] `app/api/payments/paynow/callback/route.ts` exists
- [ ] `app/api/payments/paylater/create/route.ts` exists

**Command to check:**
```bash
find app/api/payments -type f -name "route.ts"
```

### Pages
- [ ] `app/checkout/page.tsx` has been updated (451 lines)
- [ ] `app/orders/page.tsx` has been updated (200+ lines)
- [ ] `app/pay-later/[planId]/page.tsx` exists (284 lines)

**Command to check:**
```bash
grep -l "PayNowPayment\|PayLaterPlans" app/checkout/page.tsx app/orders/page.tsx
```

### Database Migrations
- [ ] `scripts/003_paynow_paylater.sql` exists
- [ ] Migration creates all required tables

**Command to check:**
```bash
ls scripts/003_paynow_paylater.sql
wc -l scripts/003_paynow_paylater.sql
```

### Documentation
- [ ] `PAYNOW_PAYLATER_GUIDE.md` exists (591 lines)
- [ ] `PAYMENT_SETUP.md` exists (321 lines)
- [ ] `PAYMENTS_FEATURES.md` exists (432 lines)
- [ ] `PAYMENT_INTEGRATION_SUMMARY.md` exists (499 lines)
- [ ] `VERIFY_INSTALLATION.md` exists (this file)

**Command to check:**
```bash
ls -lh PAYNOW* PAYMENT* VERIFY*
```

### Configuration
- [ ] `.env.example` has been updated with PayNow variables
- [ ] `package.json` has required dependencies

**Command to check:**
```bash
grep PAYNOW .env.example
grep "@supabase/ssr\|@supabase/supabase-js" package.json
```

---

## 🧪 Code Verification

### PayNow Component Imports
Check that checkout page imports PayNow component:

```bash
grep "import.*PayNowPayment" app/checkout/page.tsx
# Expected: import { PayNowPayment } from '@/components/PayNowPayment'
```

### PayLater Component Imports
Check that checkout page imports PayLater component:

```bash
grep "import.*PayLaterPlans" app/checkout/page.tsx
# Expected: import { PayLaterPlans } from '@/components/PayLaterPlans'
```

### Payment Method State
Check that checkout page has payment method state:

```bash
grep "paymentMethod" app/checkout/page.tsx
# Should have useState for payment method selection
```

### Orders Page Updates
Check that orders page shows payment info:

```bash
grep "payment_status\|payment_method" app/orders/page.tsx
# Should display payment badges and methods
```

---

## 🗄️ Database Verification

### Check Tables Exist (in Supabase)

Run this SQL in Supabase SQL Editor:

```sql
-- Check PayNow transactions table
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'paynow_transactions';

-- Check Pay Later plans table
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'pay_later_plans';

-- Check instalments table
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'pay_later_installments';

-- Check orders table has new columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'orders'
AND column_name IN ('payment_status', 'payment_method', 'pay_later_plan_id');
```

**Expected Results:**
- ✅ `paynow_transactions` table exists
- ✅ `pay_later_plans` table exists
- ✅ `pay_later_installments` table exists
- ✅ `orders.payment_status` column exists
- ✅ `orders.payment_method` column exists
- ✅ `orders.pay_later_plan_id` column exists

### Check RLS Policies

```sql
-- List all RLS policies on payment tables
SELECT * FROM pg_policies 
WHERE tablename IN ('paynow_transactions', 'pay_later_plans', 'pay_later_installments');
```

**Expected:** Multiple policies for SELECT, INSERT, UPDATE, DELETE

---

## 🚀 Local Testing

### Step 1: Start Dev Server
```bash
cd /vercel/share/v0-project
pnpm install
pnpm dev
```

### Step 2: Test PayNow Component

1. Go to http://localhost:3000
2. Navigate to `/shop`
3. Add an item to cart
4. Go to `/checkout`
5. Fill in all required fields
6. Click "Continue to Payment"
7. **Expected**: Payment method selection appears
8. Select "PayNow - Instant Payment"
9. **Expected**: PayNow form appears with phone/email fields
10. Enter test phone: `+263712345678`
11. Enter test email: `test@example.com`
12. Click "Pay with PayNow"
13. **Expected**: Polling starts, shows loading state

### Step 3: Test Pay Later Component

1. Back in checkout (create new order)
2. Click "Continue to Payment"
3. Select "Pay Later - Flexible Plans"
4. **Expected**: Three plan cards appear
5. Click on 6-month plan
6. **Expected**: Plan selected with blue highlight
7. Click "Select Plan"
8. **Expected**: Processing message appears
9. **Expected**: Plan creation successful message

### Step 4: Check Orders Page

1. Navigate to `/orders`
2. **Expected**: Recent orders appear
3. **For PayNow order**: Should show PayNow badge
4. **For Pay Later order**: Should show Pay Later badge
5. For Pay Later: Should show plan info and link to schedule

### Step 5: Check Pay Later Schedule Page

1. In orders, find Pay Later order
2. Click "View Instalment Schedule"
3. **Expected**: Redirects to `/pay-later/[planId]`
4. **Expected**: Shows payment schedule
5. **Expected**: Shows all 6 instalments with dates
6. **Expected**: Progress bar visible

---

## 🔍 Browser Console Checks

### Open Browser DevTools (F12)

#### Check for TypeScript Errors
```javascript
// Should not see TypeScript errors
// Errors should not be related to PayNow or PayLater components
```

#### Check Network Requests
When testing PayNow:
1. Open Network tab
2. Should see requests to:
   - `/api/payments/paynow/initiate`
   - `/api/payments/paynow/poll` (repeated)

When testing Pay Later:
1. Should see requests to:
   - `/api/payments/paylater/create`

#### Check Console Logs
```javascript
// Should see logs like:
// "[v0] PayNow initialization..."
// "[v0] Poll status: pending"
// "[v0] Payment successful"
```

---

## 📦 Dependencies Check

### Check Required Packages

```bash
grep -E "@supabase|swr" package.json
```

**Expected:**
```json
"@supabase/ssr": "^0.6.1",
"@supabase/supabase-js": "^2.49.4",
"swr": "^2.3.0"
```

### Verify Installation

```bash
pnpm list @supabase/ssr @supabase/supabase-js swr
```

**Expected:** All packages listed with version numbers

---

## 🌐 Environment Variables Check

### Check .env.local

```bash
cat .env.local | grep -E "PAYNOW|SUPABASE|APP_URL"
```

**Expected output:**
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_PAYNOW_INTEGRATION_ID=...
PAYNOW_INTEGRATION_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Verify No Hardcoded Keys

```bash
grep -r "PAYNOW_INTEGRATION_KEY" lib/ app/ components/ --include="*.ts" --include="*.tsx"
# Should NOT find any hardcoded keys
```

---

## 🎯 Feature Completeness Check

### Checkout Page Features

- [ ] Contact information form
- [ ] Shipping address form
- [ ] Payment method selection
- [ ] PayNow payment option with form
- [ ] Pay Later plan selection
- [ ] Order summary sidebar
- [ ] Price breakdown (subtotal, tax, shipping)

**Manual Check:**
Go to `/checkout` and verify all sections present.

### Orders Page Features

- [ ] Displays list of orders
- [ ] Shows payment method badge
- [ ] Shows payment status
- [ ] For PayNow: Shows payment confirmation
- [ ] For Pay Later: Shows instalment info
- [ ] Link to view instalment schedule
- [ ] Order breakdown details

**Manual Check:**
Go to `/orders` (after creating test orders).

### Pay Later Schedule Page

- [ ] Shows plan overview (4 cards)
- [ ] Progress bar visible
- [ ] All instalments listed with dates
- [ ] Status badges on each instalment
- [ ] Plan terms section
- [ ] Action buttons

**Manual Check:**
Go to `/pay-later/[planId]`.

---

## 🚨 Error Handling Check

### Test Error Scenarios

#### Missing Phone Number
1. Click PayNow
2. Leave phone empty
3. Click Pay
4. **Expected**: Error message about missing phone

#### Invalid Payment Method
1. Try to proceed without selecting payment method
2. **Expected**: Cannot proceed or error message

#### Missing Order
1. Manually navigate to `/pay-later/invalid-id`
2. **Expected**: Redirected to `/orders` with error

#### Network Error
1. Turn off internet
2. Try to initiate payment
3. **Expected**: Error message displayed
4. Turn internet back on
5. Should be able to retry

---

## 📊 Database Content Verification

### Check Migration Applied

Run in Supabase SQL Editor:

```sql
-- Check if tables have any data
SELECT COUNT(*) as transaction_count FROM paynow_transactions;
SELECT COUNT(*) as plan_count FROM pay_later_plans;
SELECT COUNT(*) as installment_count FROM pay_later_installments;
```

**Expected:** Counts are 0 initially (or match test data you created)

### Check RLS Status

```sql
-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('paynow_transactions', 'pay_later_plans', 'pay_later_installments');
```

**Expected:** All show `rowsecurity = true`

---

## 🔐 Security Verification

### Check No Exposed Keys

```bash
# Search for exposed API keys
grep -r "PAYNOW_INTEGRATION_KEY\|paynow_secret" app/ lib/ components/ --include="*.ts" --include="*.tsx"
grep -r "const PAYNOW_CONFIG.*key.*=" lib/paynow.ts

# Should only find: process.env.PAYNOW_INTEGRATION_KEY (environment variable reference)
```

### Check CORS Configuration

If deployed, check:
1. Callbacks work from your domain
2. Payment endpoints accessible only authenticated users
3. No exposed payment data in API responses

### Check RLS Implementation

Verify users can't access other users' payments:

```sql
-- This should show empty results for a user:
SELECT * FROM paynow_transactions 
WHERE user_id != '(your-user-id)';
```

---

## ✨ Final Sign-Off Checklist

- [ ] All files present and accounted for
- [ ] Code compiles without TypeScript errors
- [ ] Local dev server starts: `pnpm dev`
- [ ] Checkout page renders correctly
- [ ] PayNow component displays without errors
- [ ] PayLater component displays without errors
- [ ] Orders page shows payment information
- [ ] Pay Later schedule page works
- [ ] Database migrations executed
- [ ] All tables exist in Supabase
- [ ] RLS policies are enabled
- [ ] Environment variables configured
- [ ] No hardcoded secrets found
- [ ] API routes respond correctly
- [ ] Documentation complete and accurate

---

## 🆘 Troubleshooting

### Issue: Components not rendering

**Check:**
```bash
# Verify components are exported correctly
grep "export.*PayNowPayment\|export default" components/PayNowPayment.tsx
grep "export.*PayLaterPlans\|export default" components/PayLaterPlans.tsx
```

### Issue: API routes not working

**Check:**
```bash
# Verify route files exist and export
ls -la app/api/payments/paynow/*/route.ts
ls -la app/api/payments/paylater/*/route.ts
```

### Issue: Database tables not found

**Check:**
1. Run migration: `/scripts/003_paynow_paylater.sql`
2. Verify tables in Supabase SQL Editor
3. Check table names exactly match code

### Issue: TypeScript errors

**Check:**
```bash
# Run type checking
pnpm tsc --noEmit

# Should show no errors related to payment files
```

---

## 📞 Support

If verification fails:

1. Check the error message carefully
2. Review relevant documentation file:
   - General setup → `PAYMENT_SETUP.md`
   - Technical details → `PAYNOW_PAYLATER_GUIDE.md`
   - Features → `PAYMENTS_FEATURES.md`
3. Check server logs: `pnpm dev` output
4. Check browser console: F12 → Console tab
5. Review database: Supabase Dashboard → SQL Editor

---

**Verification Date:** _______________
**Status:** ☐ Passed ☐ Needs Work
**Notes:** _________________________________________________________________

---

✅ **All verifications passed? You're ready to test and deploy!**
