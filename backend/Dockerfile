# Backend Dockerfile for InvestIQ
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Build the application
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 investiq

# Copy built application
COPY --from=builder --chown=investiq:nodejs /app/dist ./dist
COPY --from=deps --chown=investiq:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=investiq:nodejs /app/package.json ./package.json

USER investiq

EXPOSE 4000

CMD ["npm", "start"]
