# Stage 1: Build Frontend Assets
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies including devDependencies (needed for Vite build)
RUN npm ci

# Copy full application source
COPY . .

# Build Vite frontend bundle (outputs to public/dist)
RUN npm run build

# Stage 2: Production Server
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application files and built static assets
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/data ./data
COPY --from=builder /app/public ./public

# Default PORT (Render automatically injects PORT at runtime)
ENV PORT=8884
EXPOSE 8884

# Start the Express server
CMD ["node", "server.js"]
