# Production Dockerfile for Freelancer Marketplace Billing Backend (Monorepo)
FROM node:18-slim AS base

# Install dependencies needed for building and Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy package files from monorepo root
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages/shared/package*.json ./packages/shared/

# Install all dependencies
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Build shared package first
WORKDIR /app/packages/shared
RUN npm run build

# Build backend
WORKDIR /app/apps/backend
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:18-slim AS runner
WORKDIR /app

# Install runtime dependencies for Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3001

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 marketplace

# Copy built application from backend
COPY --from=base --chown=marketplace:nodejs /app/apps/backend/dist ./dist
COPY --from=base --chown=marketplace:nodejs /app/apps/backend/package*.json ./
COPY --from=base --chown=marketplace:nodejs /app/apps/backend/prisma ./prisma

# Copy built shared package
COPY --from=base --chown=marketplace:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=base --chown=marketplace:nodejs /app/packages/shared/package*.json ./packages/shared/

# Copy all node_modules including shared package (already built and installed)
COPY --from=base --chown=marketplace:nodejs /app/node_modules ./node_modules

USER marketplace

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", "dist/index.js"]

