# ---------- Base ----------
FROM node:20-bookworm-slim AS base

# Prisma + bcrypt need OpenSSL and build tools on slim images
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# ---------- Dependencies ----------
FROM base AS deps

COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Install ALL deps (including dev) so prisma CLI + tsx are available
RUN npm ci

# Generate Prisma Client for the runtime platform
RUN npx prisma generate

# ---------- Builder ----------
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .

# If you have a build step (tsc, next build, vite, etc.), run it here.
# Remove if your app runs directly from source.
# RUN npm run build

# ---------- Runner ----------
FROM base AS runner

# Non-root user
RUN groupadd --system --gid 1001 nodejs \
 && useradd  --system --uid 1001 --gid nodejs appuser

# Copy everything we need
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/prisma       ./prisma
COPY --from=builder --chown=appuser:nodejs /app/package.json ./package.json
COPY --from=builder --chown=appuser:nodejs /app ./

# Folder for the SQLite DB (mounted as a volume in production)
RUN mkdir -p /app/data && chown -R appuser:nodejs /app/data

USER appuser

EXPOSE 3000

# Entrypoint: push schema, seed if empty, then start the app
COPY --chown=appuser:nodejs docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]