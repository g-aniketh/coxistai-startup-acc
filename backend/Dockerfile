# Use Node.js 20 Alpine for better compatibility
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies for Prisma and native modules
RUN apk add --no-cache openssl curl wget

# Copy package files first for better caching
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including dev dependencies for build)
# Use npm ci for faster, reliable, reproducible builds
RUN npm ci

# Generate Prisma client (before copying source to leverage cache)
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies and prune to reduce image size
RUN npm prune --production && rm -rf /tmp/* /var/cache/apk/* ~/.npm

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3001/api/v1/health || exit 1

# Start the application
CMD ["npm", "start"]
