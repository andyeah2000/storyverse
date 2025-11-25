# ============================================
# StoryVerse Dockerfile
# Multi-stage build for optimized production image
# ============================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --silent

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user for security
RUN addgroup -g 1001 -S storyverse && \
    adduser -S -D -H -u 1001 -h /usr/share/nginx/html -s /sbin/nologin -G storyverse storyverse && \
    chown -R storyverse:storyverse /usr/share/nginx/html && \
    chown -R storyverse:storyverse /var/cache/nginx && \
    chown -R storyverse:storyverse /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R storyverse:storyverse /var/run/nginx.pid

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Expose port
EXPOSE 80

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
