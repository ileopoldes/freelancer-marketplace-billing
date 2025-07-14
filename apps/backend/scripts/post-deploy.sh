#!/bin/bash

# Post-deployment script for BillForge Backend
# This script runs database migrations and seeding after deployment

set -e  # Exit on any error

echo "🚀 Starting post-deployment setup..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    exit 1
fi

echo "📊 Running database migrations..."
npx prisma migrate deploy

echo "🌱 Checking if database needs seeding..."
# Check if there are any customers (indicating the database is already seeded)
CUSTOMER_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) as count FROM customers;" | grep -o '[0-9]\+' | head -1 || echo "0")

if [ "$CUSTOMER_COUNT" -eq "0" ]; then
    echo "🌱 Database is empty, running seed script..."
    npx tsx prisma/seed.ts
    echo "✅ Database seeded successfully with demo data"
else
    echo "✅ Database already contains $CUSTOMER_COUNT customers, skipping seed"
fi

echo "🎉 Post-deployment setup completed successfully!"
echo "📊 Database ready with customers, contracts, and usage data"
echo "🔗 Ready to process billing jobs and generate invoices"

