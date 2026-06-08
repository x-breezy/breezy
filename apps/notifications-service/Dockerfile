FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/ ./packages/
COPY apps/notifications-service/ ./apps/notifications-service/
RUN npm ci --workspace=notifications-service
RUN npm run build --workspace=notifications-service

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/notifications-service/dist ./apps/notifications-service/dist
COPY --from=builder /app/apps/notifications-service/package.json ./apps/notifications-service/package.json
WORKDIR /app/apps/notifications-service
CMD ["node", "dist/index.js"]
