#!/bin/sh
set -e

echo "▶ Running Prisma db push..."
npx prisma db push --skip-generate || {
  echo "⚠ prisma db push failed — continuing anyway"
}

echo "▶ Ensuring database is seeded..."
npm run prisma:seed || echo "⚠ Seed script notice — continuing."

echo "▶ Starting application..."
exec "$@"