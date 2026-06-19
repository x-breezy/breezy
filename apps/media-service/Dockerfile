FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/ ./packages/
COPY apps/media-service/ ./apps/media-service/
RUN npm ci --workspace=media-service
RUN npm run build --workspace=media-service
RUN mkdir -p /app/apps/media-service/dist/config/data && \
    cp /app/apps/media-service/src/config/data/media.service.proto \
       /app/apps/media-service/dist/config/data/media.service.proto

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/media-service/dist ./apps/media-service/dist
COPY --from=builder /app/apps/media-service/package.json ./apps/media-service/package.json
WORKDIR /app/apps/media-service
CMD ["node", "dist/index.js"]
