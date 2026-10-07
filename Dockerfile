# ---------- Base ----------
FROM node:20-bookworm-slim AS base

# Prisma + bcrypt need OpenSSL and build tools on slim images
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV PORT=3000
# NOTE: NODE_ENV is intentionally NOT set here.
# Setting it here would make `npm ci` in the deps stage skip devDependencies,
# which we need (tsx, vite, prisma CLI, concurrently).

# ---------- Dependencies ----------
FROM base AS deps

COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Install ALL deps (including dev) so prisma CLI + tsx + vite are available
RUN npm ci --include=dev

# Generate Prisma Client for the runtime platform
RUN npx prisma generate

# ---------- Builder ----------
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma       ./prisma
COPY . .

# If you have a real build step (tsc, vite build, etc.), enable it here.
# RUN npm run build

# ---------- Runner ----------
FROM base AS runner

# Production env only for the runtime stage
ENV NODE_ENV=production

# Non-root user
RUN groupadd --system --gid 1001 nodejs \
 && useradd  --system --uid 1001 --gid nodejs appuser

# Copy dependencies and Prisma artifacts from builder
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/prisma       ./prisma
COPY --from=builder --chown=appuser:nodejs /app/package.json ./package.json
COPY --from=builder --chown=appuser:nodejs /app/package-lock.json* ./

# Copy only the source / config files the app needs at runtime.
# DO NOT `COPY --from=builder /app ./` — it would clobber /app/node_modules.
COPY --from=builder --chown=appuser:nodejs /app/src            ./src
COPY --from=builder --chown=appuser:nodejs /app/prisma         ./prisma
COPY --from=builder --chown=appuser:nodejs /app/vite.config.ts ./vite.config.ts
COPY --from=builder --chown=appuser:nodejs /app/vite.config.js ./vite.config.js
COPY --from=builder --chown=appuser:nodejs /app/tsconfig.json  ./tsconfig.json
COPY --from=builder --chown=appuser:nodejs /app/index.html     ./index.html

# Folder for the SQLite DB (mounted as a volume in production)
RUN mkdir -p /app/data && chown -R appuser:nodejs /app/data

USER appuser

EXPOSE 3000

# Entrypoint: push schema, seed if empty, then start the app
COPY --chown=appuser:nodejs docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]