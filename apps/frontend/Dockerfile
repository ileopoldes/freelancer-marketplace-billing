# Production Dockerfile for BillForge Frontend (Monorepo)
FROM node:18-slim AS base

# Install dependencies needed for building
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy package files from monorepo root
COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/
COPY packages/shared/package*.json ./packages/shared/

# Install all dependencies
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Build shared package first
WORKDIR /app/packages/shared
RUN npm run build

# Build frontend
WORKDIR /app/apps/frontend

# Copy shared files to frontend src/shared (like the build script does)
RUN rm -rf src/shared && mkdir -p src/shared
RUN cp -r ../../packages/shared/src/* src/shared/ 2>/dev/null || true

# Run Next.js build
RUN npx next build

# Production stage
FROM node:18-slim AS runner
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

# Copy built Next.js application
COPY --from=base --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=base --chown=nextjs:nodejs /app/apps/frontend/.next/static ./apps/frontend/.next/static

# Create public directory (Next.js may not have one by default)
RUN mkdir -p ./apps/frontend/public

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", "apps/frontend/server.js"]

