# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Install ALL dependencies (dev + prod needed for build + prisma gen)
# ─────────────────────────────────────────────────────────────────────────────
FROM node:24-alpine AS deps

# openssl  — required by Prisma on Alpine
# libc6-compat — compatibility shims for glibc-linked Node native addons
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# postinstall script runs `prisma generate` automatically
RUN npm ci

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Build Next.js
# ─────────────────────────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ensure Prisma client is up to date with schema
RUN npx prisma generate

# Declare NEXT_PUBLIC_* build args so Railway injects them during docker build.
# These are baked into the JS bundle by `next build` — they MUST exist at build time.
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
ARG NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=$NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
ENV NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=$NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

# Build Next.js app
# NOTE: `prisma db push` is intentionally skipped here — no live DB during image build.
#       It runs at container startup in CMD below.
RUN npx next build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3 — Production runner (minimal image)
# ─────────────────────────────────────────────────────────────────────────────
FROM node:24-alpine AS runner

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

ENV NODE_ENV=production

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# ── Copy built artifacts from builder ────────────────────────────────────────

# Next.js build output
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# Static assets
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Custom server + service-worker (already in public, but server.js is at root)
COPY --from=builder --chown=nextjs:nodejs /app/server.js ./server.js

# Prisma schema + migrations (needed for `prisma db push` at startup)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# package.json (needed by Next.js and npm scripts)
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Full node_modules — includes prisma CLI (devDep) needed for `db push` at startup
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# ── Runtime config ────────────────────────────────────────────────────────────

USER nextjs

# Railway injects $PORT automatically; default to 8080
EXPOSE 8080
ENV PORT=8080

# At startup:
#  1. Push schema changes to DB (idempotent, safe to run every deploy)
#  2. Start custom Node.js server (HTTP + WebSocket printer bridge)
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node server.js"]

