# ---------- Base ----------
FROM node:22-bookworm-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV PORT=5173
# NODE_ENV deliberately NOT set here, so deps stage installs devDependencies.

# ---------- Dependencies ----------
FROM base AS deps

COPY package.json package-lock.json* ./
COPY prisma ./prisma

RUN npm ci --include=dev
RUN npx prisma generate

# ---------- Builder ----------
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma       ./prisma
COPY . .

# Enable if you have a build step:
# RUN npm run build

# ---------- Runner ----------
FROM base AS runner

ENV NODE_ENV=production

RUN groupadd --system --gid 10001 nodejs \
 && useradd  --system --uid 10001 --gid nodejs appuser

# Deps + Prisma client
COPY --from=builder --chown=appuser:nodejs /app/node_modules       ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/prisma             ./prisma
COPY --from=builder --chown=appuser:nodejs /app/package.json       ./package.json
COPY --from=builder --chown=appuser:nodejs /app/package-lock.json* ./

# Application source + Vite/PostCSS/Tailwind config
COPY --from=builder --chown=appuser:nodejs /app/src                    ./src
COPY --from=builder --chown=appuser:nodejs /app/index.html             ./index.html
COPY --from=builder --chown=appuser:nodejs /app/vite.config.ts         ./vite.config.ts
COPY --from=builder --chown=appuser:nodejs /app/postcss.config.mjs     ./postcss.config.mjs
COPY --from=builder --chown=appuser:nodejs /app/default_shadcn_theme.css ./default_shadcn_theme.css
# Remove the next line if you have no tests dir, or don't run tests at runtime:
# COPY --from=builder --chown=appuser:nodejs /app/tests ./tests

RUN mkdir -p /app/data && chown -R appuser:nodejs /app/data

USER appuser
EXPOSE 5173

COPY --chown=appuser:nodejs docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]