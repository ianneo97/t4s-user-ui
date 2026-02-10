# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps --ignore-scripts
COPY . .
RUN npm run build

# Serve with simple http-server
FROM node:20-alpine
WORKDIR /app
RUN npm install -g http-server
COPY --from=builder /app/build ./build
ENV PORT=3000
EXPOSE 3000
CMD http-server ./build -p $PORT -a 0.0.0.0 --proxy http://localhost:$PORT?
