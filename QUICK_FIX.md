# edgARs Quick Fix Guide

## Problem 1: Products Not Showing ❌

**What you see:** Shop page is empty, no products displayed

**What's wrong:** Database tables don't exist or aren't populated

### Fix in 3 Steps:

**Step 1: Create Database Tables**
1. Go to https://supabase.com → Open your project
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy ALL text from: `scripts/005_create_all_tables.sql`
5. Paste into editor
6. Click **Run**
7. Wait for green checkmark ✓

**Step 2: Add Sample Products**
1. Click **New Query** again
2. Copy ALL text from: `scripts/006_seed_products.sql`
3. Paste into editor
4. Click **Run**
5. Wait for green checkmark ✓

**Step 3: Verify It Worked**
1. Go to **Table Editor** (left sidebar)
2. Click **products** table
3. Should see 17 products in the list
4. Refresh http://localhost:3000/shop
5. Products should now be visible! 🎉

---

## Problem 2: Confirmation Emails Not Sending ❌

**What happens:** Users sign up but don't receive confirmation email

**What's needed:** Email confirmations must be enabled in Supabase

### Fix in 5 Steps:

**Step 1: Enable Email Confirmations**
1. Go to your Supabase project
2. Click **Authentication** (left sidebar)
3. Click **Settings** (gear icon)
4. Find **Email Authentication** section
5. Toggle **Enable email confirmations** ON
6. Click **Save**

**Step 2: Verify Email Templates**
1. In same **Settings** page
2. Scroll down to **Email Templates**
3. Click **Confirm signup**
4. Verify it contains `{{ .ConfirmationURL }}`
5. Click **Save**

**Step 3: Set App URL in .env.local**

Make sure `.env.local` has:
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

(Change to your domain for production)

**Step 4: Test Email Sending**
1. In Supabase, go to **Authentication → Users**
2. Click **Add user** (top right)
3. Email: `test@example.com`
4. Password: `TestPass123!`
5. Check **Auto confirm user**
6. Click **Save**
7. In users list, find the user
8. Click the **...** menu
9. Select **Send Confirmation Email**
10. Check your email for confirmation

**Step 5: Confirm It Works**
1. Delete the test user (click user → delete)
2. Go to http://localhost:3000/auth/signup
3. Sign up with a new email
4. Check email inbox for confirmation
5. If you see it, emails are working! 📧

**Troubleshooting Emails:**
- Check **spam/junk folder** first
- If still not there, go to Supabase **Settings → Logs**
- Look for "email" in logs to see what happened
- Email is sent automatically by Supabase after signup

---

## Problem 3: Admin Can't Login ❌

**What happens:** Can't access `/admin` dashboard

**What's needed:** Create admin user account and mark as admin

### Fix in 3 Steps:

**Step 1: Create Admin Account**
1. Go to Supabase **Authentication → Users**
2. Click **Add user** (top right)
3. Enter:
   - Email: `admin@edgars.com`
   - Password: `AdminEdgars2024!`
4. Check **Auto confirm user**
5. Click **Save**

**Step 2: Mark User as Admin**
1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Paste this SQL:
```sql
INSERT INTO profiles (id, full_name, email, is_admin)
SELECT id, 'Admin User', email, TRUE
FROM auth.users
WHERE email = 'admin@edgars.com'
ON CONFLICT (id) DO NOTHING;
```
4. Click **Run**

**Step 3: Login to Admin**
1. Go to http://localhost:3000/admin
2. Login with:
   - Email: `admin@edgars.com`
   - Password: `AdminEdgars2024!`
3. You should see admin dashboard 🎉

---

## Problem 4: .env.local Not Set Up ❌

**What to do:**

Create a new file called `.env.local` in your project root with:

```
# Get these values from Supabase → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5...

# Local development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# PayNow (optional for now)
NEXT_PUBLIC_PAYNOW_INTEGRATION_ID=test-id
PAYNOW_INTEGRATION_KEY=test-key
```

**How to get the keys:**
1. Go to https://supabase.com
2. Open your project
3. Click **Settings** (bottom left)
4. Click **API**
5. Copy the three values shown
6. Paste into `.env.local`
7. Save file
8. Restart dev server: `pnpm dev`

---

## Complete Verification Checklist

After following all fixes above, verify everything works:

### ✓ Database Setup
- [ ] Go to Supabase → Table Editor
- [ ] See these tables: products, profiles, carts, orders, payment_logs
- [ ] products table has 17 rows

### ✓ Products Showing
- [ ] http://localhost:3000 shows featured products
- [ ] http://localhost:3000/shop shows all 17 products
- [ ] Can click products to view details

### ✓ Admin Working
- [ ] Can login to http://localhost:3000/admin
- [ ] Admin dashboard shows products, payments, stats
- [ ] Can add/edit/delete products

### ✓ Authentication
- [ ] Can signup at /auth/signup
- [ ] Can login at /auth/login
- [ ] Confirmation email appears (check inbox + spam folder)

### ✓ Shopping Cart
- [ ] Can add product to cart (after login)
- [ ] Cart persists on page refresh
- [ ] Can proceed to checkout

---

## If You're Still Having Issues

1. **Restart the dev server:**
   ```bash
   Ctrl+C
   pnpm dev
   ```

2. **Check browser console for errors:**
   - Press `F12`
   - Click **Console** tab
   - Look for red error messages

3. **Check Supabase logs:**
   - Supabase → **Settings → Logs**
   - Look for recent errors

4. **Verify all env variables:**
   - Check `.env.local` is in project root
   - URLs should start with `https://` (not http)
   - No typos in keys

5. **Try incognito window:**
   - Clears browser cache
   - Opens fresh session

6. **Read the full guide:**
   - See `DATABASE_SETUP_GUIDE.md` for detailed steps
   - See `TROUBLESHOOTING.md` for specific issues

---

## Your edgARs store is ready! 🎉

Once all steps above are complete:
- Visit http://localhost:3000 to see your store
- Signup and start shopping
- Login as admin to manage products and payments
- Check email confirmations are being sent

Enjoy building with edgARs!
