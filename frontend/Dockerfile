# Use Node.js 20 Alpine for better compatibility
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
# Install ALL dependencies (including dev dependencies needed for build)
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Accept build arguments (from docker-compose or root .env)
# This takes precedence over .env file if provided
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
# Copy source code (including .env file)
# Note: If NEXT_PUBLIC_API_URL build arg is empty/unset, Next.js will read from .env file during build
COPY . .

# Build the application (dependencies already installed, so no npm install needed)
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Install wget for healthcheck
RUN apk add --no-cache wget

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

CMD ["node", "server.js"]
