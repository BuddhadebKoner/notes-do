# Production Dockerfile for Notes-Do Backend
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory and nodejs user
RUN addgroup -g 1001 -S nodejs && \
   adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files first for better caching
COPY package.json ./

# Install all dependencies first, then remove dev dependencies
RUN npm install --no-audit --no-fund && \
   npm prune --production && \
   npm cache clean --force

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads/thumbnails src/temp/pdf-processing

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
   CMD node -e "http.get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start application
CMD ["dumb-init", "node", "server.js"]