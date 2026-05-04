# edgARs Troubleshooting Guide

## Issue: Products Not Showing on Shop Page

### Symptoms
- Shop page displays "No products found"
- Home page featured section is empty
- Categories don't filter anything

### Causes & Solutions

**Cause 1: Database tables not created**
```
Check: Open Supabase dashboard → Table Editor
```
- If you see no tables listed, run `scripts/005_create_all_tables.sql`
- Go to SQL Editor → New Query
- Copy entire SQL file
- Click Run

**Cause 2: Products not seeded**
```
Check: Table Editor → Select 'products' table → Should show 17 rows
```
- If table is empty, run `scripts/006_seed_products.sql`
- Same process as above

**Cause 3: Supabase connection not working**
```
Check: Browser console (F12 → Console tab) for errors
```
- Verify `.env.local` has correct values:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxx...
  ```
- URL must start with `https://` (not http)
- Keys should not have any typos

**Cause 4: RLS policies blocking reads**
```
Check: Supabase → SQL Editor → View RLS policies
```
- Products table should have public read policy
- Run this to verify:
  ```sql
  SELECT * FROM products LIMIT 5;
  ```
- If you get "permission denied", check RLS policies on products table

### Quick Fix Checklist
- [ ] Tables exist in Supabase (Table Editor)
- [ ] Products table has 17 rows (Table Editor → products)
- [ ] `.env.local` has correct Supabase URL and keys
- [ ] NEXT_PUBLIC_SUPABASE_URL starts with `https://`
- [ ] Browser console has no errors (F12 → Console)
- [ ] Restart dev server: `pnpm dev`

---

## Issue: Confirmation Emails Not Being Sent

### Symptoms
- Users sign up but don't receive confirmation email
- No "Verify Email" message shown
- Can't login until email is confirmed

### Root Cause
Supabase doesn't send emails unless:
1. Email confirmations are enabled in Auth settings
2. Email templates are configured
3. Valid SMTP is set up (or using Supabase's default service)

### Solution

**Step 1: Enable Email Confirmations in Supabase**
1. Go to your Supabase project
2. Click **Authentication** (left sidebar)
3. Click **Settings** (gear icon)
4. Scroll to **Email Authentication**
5. Check: "Enable email confirmations"
6. Save

**Step 2: Configure Email Templates**
1. Still in **Authentication → Settings**
2. Scroll to **Email Templates**
3. Click on **Confirm signup**
4. Verify the template contains a confirmation link
5. The `{{ .ConfirmationURL }}` should be present
6. Save

**Step 3: Set NEXT_PUBLIC_APP_URL**
The confirmation link includes your app URL. Verify:

**For Development:**
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**For Production:**
```
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Step 4: Test Email Sending**

In Supabase:
1. Go to **Authentication → Users**
2. Click **Add user** (top right)
3. Enter test email
4. Check "Auto confirm user"
5. Save
6. In the user list, click the user's 3-dot menu
7. Select "Send Confirmation Email"

Check the email inbox for the confirmation message.

**Step 5: Configure SMTP for Production** (Optional)

For better email delivery in production:
1. Go to **Settings → Email**
2. If using custom SMTP, configure it
3. Otherwise, Supabase's default service will handle emails

### Email Confirmation Flow

```
User Signup → Supabase Auth → Confirmation Email Sent
                              ↓
                        User Clicks Link
                              ↓
                         Email Verified
                              ↓
                      User Can Login
```

### Verify Email Confirmation Works

1. Go to http://localhost:3000/auth/signup
2. Sign up with an email
3. Check spam folder for confirmation email
4. Click confirmation link
5. Should redirect to `/auth/callback`
6. User profile should be created

### If Emails Still Not Sending

**Check Supabase Logs:**
1. Go to **Settings → Logs**
2. Filter by recent activity
3. Look for "email" in the logs
4. Any errors will show why emails failed

**Common Issues:**
- Email address is invalid
- Supabase SMTP not configured
- Domain reputation blocking emails (check spam folder)
- Email templates deleted or corrupted

---

## Issue: Admin Dashboard Not Accessible

### Symptoms
- Can't login to `/admin`
- See "Unauthorized" message
- Admin features not visible

### Causes & Solutions

**Cause 1: User not marked as admin**

Check in Supabase:
```sql
SELECT id, email, is_admin FROM profiles WHERE email = 'admin@edgars.com';
```

Should show `is_admin = true`

If false, update:
```sql
UPDATE profiles SET is_admin = TRUE WHERE email = 'admin@edgars.com';
```

**Cause 2: Profile doesn't exist**

If no rows returned above, create the profile:
```sql
INSERT INTO profiles (id, full_name, email, is_admin)
SELECT id, 'Admin User', email, TRUE
FROM auth.users
WHERE email = 'admin@edgars.com'
ON CONFLICT (id) DO NOTHING;
```

**Cause 3: Not logged in**

- Go to `/auth/login`
- Login as: `admin@edgars.com` / `AdminEdgars2024!`
- Wait for page redirect
- Navigate to `/admin`

**Cause 4: Session expired**

- Logout and login again
- Clear browser cache
- Try in incognito window

---

## Issue: Can't Login / Authentication Error

### Symptoms
- Login page shows errors
- "Invalid credentials" message
- Can't create account

### Solutions

**Issue: User doesn't exist**
- If no user created, signup first at `/auth/signup`
- For admin: Create user in Supabase Auth (Authentication → Users)

**Issue: Wrong password**
- Reset password in Supabase (Authentication → Users → user → Reset Password)

**Issue: Email not confirmed**
- User must confirm email before first login
- Resend confirmation from Supabase (Users → 3-dots → Send Confirmation Email)

**Issue: Multiple signup attempts**
- If same email used multiple times, only latest account is active
- Check Supabase users list for duplicates
- Delete unused accounts

---

## Issue: Cart Not Saving

### Symptoms
- Add to cart doesn't work
- Cart empties on page refresh
- "Unauthorized" error when adding to cart

### Solution

**Cause 1: Not logged in**
- Must login before adding to cart
- Cart requires `auth.uid()` for RLS policies

**Cause 2: RLS policies blocking writes**

Verify cart RLS:
```sql
SELECT * FROM carts WHERE user_id = auth.uid();
```

Should work after login.

**Cause 3: Carts table missing**

If table doesn't exist:
1. Run `scripts/005_create_all_tables.sql`

---

## Issue: Checkout Not Working

### Symptoms
- Can't proceed to checkout
- "Unauthorized" when checking out
- Empty order submissions

### Solution

**Must be logged in:**
- Checkout page requires authentication
- If not logged in, redirects to `/auth/login`

**Verify:**
1. Login to account
2. Add product to cart
3. Go to `/cart`
4. Click "Proceed to Checkout"
5. Should work if logged in

---

## Debug Mode

Enable detailed logging:

**In Browser Console (F12):**
Look for `[v0]` prefixed messages showing:
- Products being loaded
- API calls being made
- Database responses
- Auth state changes

**In Terminal:**
Run with verbose logging:
```bash
DEBUG=* pnpm dev
```

---

## Nuclear Option: Complete Reset

If everything is broken:

1. **Delete all data (WARNING: removes everything):**
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```

2. **Recreate tables:**
   - Run `scripts/005_create_all_tables.sql`
   - Run `scripts/006_seed_products.sql`

3. **Create admin:**
   - Authentication → Users → Add user
   - Email: admin@edgars.com
   - Password: AdminEdgars2024!
   - Check "Auto confirm"

4. **Create admin profile:**
   ```sql
   INSERT INTO profiles (id, full_name, email, is_admin)
   SELECT id, 'Admin', email, TRUE FROM auth.users
   WHERE email = 'admin@edgars.com'
   ON CONFLICT (id) DO NOTHING;
   ```

5. **Restart:**
   ```bash
   pnpm dev
   ```

---

## Still Need Help?

1. Check Supabase status: https://status.supabase.com
2. Review logs in Supabase dashboard
3. Check browser console for errors
4. Verify all env variables are correct
5. Try incognito window (no cache issues)
6. Restart dev server: `Ctrl+C` then `pnpm dev`

Your edgARs store should be working once these issues are resolved!
