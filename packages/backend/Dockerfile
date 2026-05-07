# Backend — multi-stage Dockerfile
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Install dependencies
FROM base AS deps
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
# Install only backend deps
RUN npm install --workspace=packages/backend --ignore-scripts

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY packages/backend/ ./packages/backend/
COPY packages/backend/prisma/ ./packages/backend/prisma/
WORKDIR /app/packages/backend
RUN npx prisma generate
RUN npx tsc --project tsconfig.json

# Production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/packages/backend/dist ./dist
COPY --from=builder /app/packages/backend/node_modules ./node_modules
COPY --from=builder /app/packages/backend/prisma ./prisma
COPY --from=builder /app/packages/backend/package.json .

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
