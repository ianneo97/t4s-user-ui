# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps --ignore-scripts
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

# Copy package.json for type: module support
COPY package*.json ./

# Install only express for production
RUN npm install express --legacy-peer-deps

# Copy build output and server
COPY --from=builder /app/build ./build
COPY server.cjs ./

ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.cjs"]
