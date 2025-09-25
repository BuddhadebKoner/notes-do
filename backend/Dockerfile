# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies (regenerate lock file if needed)
RUN npm install --omit=dev --no-fund --no-audit

# Copy the rest of the application code
COPY . .

# Create uploads directory and set permissions
RUN mkdir -p uploads/thumbnails && \
   mkdir -p src/temp/pdf-processing && \
   chown -R node:node /app

# Switch to non-root user for security
USER node

# Expose the port the app runs on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
   CMD node -e "http.get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the application
CMD ["npm", "start"]