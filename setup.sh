#!/bin/bash

# edgARs Database Setup Script
# Run with: bash setup.sh

echo "================================================"
echo "edgARs Fashion Store - Database Setup"
echo "================================================"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local not found!"
    echo ""
    echo "Please create .env.local with your Supabase credentials:"
    echo ""
    echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key"
    echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    echo "NEXT_PUBLIC_APP_URL=http://localhost:3000"
    echo ""
    exit 1
fi

echo "✓ .env.local found"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
    echo "✓ Dependencies installed"
    echo ""
fi

# Run database setup
echo "🔧 Setting up database..."
echo ""
echo "Manual setup required:"
echo "1. Go to https://supabase.com and open your project"
echo "2. Click SQL Editor"
echo "3. Create new query"
echo "4. Copy contents of: scripts/005_create_all_tables.sql"
echo "5. Paste and RUN"
echo "6. Repeat for: scripts/006_seed_products.sql"
echo "7. Go to Authentication → Users"
echo "8. Add user: admin@edgars.com / AdminEdgars2024!"
echo ""
echo "Then run:"
echo "  pnpm dev"
echo ""
echo "Visit: http://localhost:3000"
echo "Admin: http://localhost:3000/admin"
echo ""
