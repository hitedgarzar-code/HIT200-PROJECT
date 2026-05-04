# edgARs Database Setup Guide

This guide walks you through setting up the database, seeding products, and creating the admin user.

## Prerequisites

- Supabase project created (https://supabase.com)
- Node.js 18+ installed
- `pnpm` package manager

## Step 1: Get Supabase Credentials

1. Go to https://supabase.com and create/access your project
2. Navigate to **Settings → API**
3. Copy these values:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

## Step 2: Create .env.local File

Create `.env.local` in your project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# PayNow (Optional for now)
NEXT_PUBLIC_PAYNOW_INTEGRATION_ID=your-id
PAYNOW_INTEGRATION_KEY=your-key
```

## Step 3: Create Database Tables

Run the SQL migration in Supabase:

1. Go to your Supabase project dashboard
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `scripts/005_create_all_tables.sql`
5. Paste into the SQL editor
6. Click **Run**

**Expected Result:** All tables created successfully with green checkmarks

## Step 4: Seed Sample Products

Run the product seeding SQL:

1. In **SQL Editor**, click **New Query**
2. Copy contents of `scripts/006_seed_products.sql`
3. Paste and **Run**

**Expected Result:** 17 products inserted

You can verify by going to **Table Editor** and selecting the `products` table.

## Step 5: Create Admin User

### Option A: Via Supabase Dashboard (Recommended)

1. Go to **Authentication → Users** in Supabase
2. Click **Add user**
3. Email: `admin@edgars.com`
4. Password: `AdminEdgars2024!`
5. Check **Auto Confirm User**
6. Create user

### Option B: Via API (after installing dependencies)

```bash
# Install dependencies
pnpm install

# Run setup script (requires SUPABASE_SERVICE_ROLE_KEY in .env.local)
node scripts/setup-database.js
```

## Step 6: Create Admin Profile

After creating the auth user, create their profile:

1. Go to **SQL Editor** in Supabase
2. Run this query:

```sql
INSERT INTO profiles (id, full_name, email, is_admin) 
SELECT id, 'Admin User', email, TRUE 
FROM auth.users 
WHERE email = 'admin@edgars.com' 
ON CONFLICT (id) DO NOTHING;
```

## Step 7: Verify Setup

### Check Products Are Loaded

1. Go to http://localhost:3000/shop
2. You should see 17 products

### Check Admin Can Login

1. Go to http://localhost:3000/admin
2. Login with:
   - Email: `admin@edgars.com`
   - Password: `AdminEdgars2024!`
3. You should see the admin dashboard

## Troubleshooting

### Products Not Showing

**Problem:** Shop page shows "No products found"

**Solutions:**
1. Check products exist: Go to Supabase → Table Editor → Select `products` table
2. Verify products were inserted: Should see 17 rows
3. Check Supabase is connected: Verify your URL and keys in `.env.local`
4. Check browser console for errors: `F12 → Console tab`

### Confirmation Emails Not Sending

**Problem:** Users don't receive signup confirmation emails

**Solutions:**

1. **Check Email Settings in Supabase:**
   - Go to **Authentication → Email Templates**
   - Verify "Confirm signup" template is enabled
   - Ensure "Enable email confirmations" is ON (Settings → Auth)

2. **Verify App URL:**
   - In `.env.local`, ensure `NEXT_PUBLIC_APP_URL` is set correctly
   - For production, use your actual domain (not localhost)

3. **Check Supabase SMTP:**
   - Go to **Settings → Email**
   - If not configured, emails will be sent with Supabase's default service
   - For production, configure SMTP for reliable delivery

4. **Resend Confirmation Email:**
   - In Supabase dashboard, go to **Auth → Users**
   - Find the user
   - Click the 3 dots menu
   - Select "Send Confirmation Email"

### Admin Not Showing in Dashboard

**Problem:** Admin user can't access admin dashboard

**Solutions:**
1. Verify `is_admin` is TRUE in profiles table:
   ```sql
   SELECT id, email, is_admin FROM profiles WHERE email = 'admin@edgars.com';
   ```
2. Re-login after changes
3. Check RLS policies allow admin access

### Database Connection Errors

**Problem:** "Could not find the project" or connection errors

**Solutions:**
1. Verify Supabase is online (https://status.supabase.com)
2. Check URL format: Should be `https://xxxxx.supabase.co` (not `http://`)
3. Verify keys are correct in `.env.local`
4. Check network/firewall isn't blocking Supabase

## Manual Database Setup (If Scripts Fail)

If scripts fail, manually create via SQL Editor:

```sql
-- 1. Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  sizes TEXT[] DEFAULT ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  inventory JSONB,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Enable public read
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_read_all" ON products FOR SELECT USING (TRUE);

-- 3. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Then seed products and create admin user as shown above
```

## Testing the Complete Setup

1. **Start the app:**
   ```bash
   pnpm dev
   ```

2. **Test shopping:**
   - Visit http://localhost:3000
   - Browse http://localhost:3000/shop
   - See 17 products displayed

3. **Test signup:**
   - Go to http://localhost:3000/auth/signup
   - Create account
   - Check email for confirmation link

4. **Test admin:**
   - Go to http://localhost:3000/admin
   - Login with admin credentials
   - See payment logs and manage products

## Need Help?

If issues persist:
1. Check browser console for errors (`F12 → Console`)
2. Check Supabase logs (Settings → Logs)
3. Verify all environment variables are set
4. Restart the development server (`pnpm dev`)

Your edgARs store should be fully functional once setup is complete!
