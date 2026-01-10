# Multi-stage build for optimized production image
FROM node:20-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

# Create app directory with proper permissions
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app
RUN chown -R nextjs:nodejs /app

# Dependencies stage
FROM base AS deps
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts && \
    npm cache clean --force

# Build stage (if you add build steps later)
FROM base AS build
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs . .

# Production stage
FROM base AS production
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs . .

# Switch to non-root user
USER nextjs

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

EXPOSE 3000

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]

