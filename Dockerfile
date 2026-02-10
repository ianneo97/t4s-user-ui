FROM node:20-alpine

WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN npm install --legacy-peer-deps --ignore-scripts

# Build the app
RUN npm run build

# Set port
ENV PORT=3000
EXPOSE 3000

# Start with express server
CMD ["node", "server.js"]
