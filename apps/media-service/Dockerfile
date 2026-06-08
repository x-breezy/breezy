FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/ ./packages/
COPY apps/media-service/ ./apps/media-service/
RUN npm ci --workspace=media-service
RUN npm run build --workspace=media-service

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/media-service/dist ./apps/media-service/dist
COPY --from=builder /app/apps/media-service/package.json ./apps/media-service/package.json
WORKDIR /app/apps/media-service
CMD ["node", "dist/index.js"]
