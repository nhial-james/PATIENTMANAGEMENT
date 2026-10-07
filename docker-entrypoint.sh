#!/bin/sh
set -e

echo "▶ Running Prisma db push..."
npx prisma db push --skip-generate || {
  echo "⚠ prisma db push failed — continuing anyway"
}

# Seed only if the DB file does not exist yet (prevents duplicate seeding)
if [ ! -f /app/data/dev.db ] && [ ! -f /app/prisma/dev.db ]; then
  echo "▶ Seeding database..."
  npm run prisma:seed || echo "⚠ Seed failed — continuing."
else
  echo "▶ Database already exists — skipping seed."
fi

echo "▶ Starting application..."
exec "$@"