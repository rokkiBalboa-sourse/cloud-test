# Multi-stage build for lightweight production image
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV NODE_OPTIONS="--experimental-sqlite"

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# Data directory for SQLite database
VOLUME ["/app/data"]

EXPOSE 3000

CMD ["node", "server/server.js"]

