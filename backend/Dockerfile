# Use official Node.js runtime as parent image
FROM node:18.17.0-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
   poppler-utils \
   ghostscript \
   imagemagick \
   ffmpeg

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/thumbnails temp/pdf-processing

# Expose port
EXPOSE 3000

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
   adduser -S nextjs -u 1001

# Change ownership of app directory
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
   CMD node health-check.js || exit 1

# Start the application
CMD ["npm", "start"]