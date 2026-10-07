#!/bin/sh
set -e

echo "▶ Running Prisma db push..."
npx prisma db push --skip-generate

# Seed only if the DB is empty (idempotent thanks to upserts, but avoids re-runs)
if [ "${SEED_ON_START:-true}" = "true" ]; then
  echo "▶ Seeding database..."
  npm run prisma:seed || echo "⚠ Seed failed or already applied — continuing."
fi

echo "▶ Starting application..."
exec "$@"