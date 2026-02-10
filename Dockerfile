# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm install --legacy-peer-deps --ignore-scripts

# Copy source
COPY . .

# Build
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files and install production deps only
COPY package*.json ./
RUN npm install --legacy-peer-deps --ignore-scripts --omit=dev

# Copy built files and server
COPY --from=builder /app/build ./build
COPY server.js ./

# Expose port
EXPOSE 3000

# Start
CMD ["node", "server.js"]
