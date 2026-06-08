FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/ ./packages/
COPY apps/post-service/ ./apps/post-service/
RUN npm ci --workspace=post-service
RUN npm run build --workspace=post-service
RUN mkdir -p /app/apps/post-service/dist/config/data && \
    cp /app/apps/post-service/src/config/data/post.service.proto \
       /app/apps/post-service/dist/config/data/post.service.proto

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/post-service/dist ./apps/post-service/dist
COPY --from=builder /app/apps/post-service/package.json ./apps/post-service/package.json
WORKDIR /app/apps/post-service
CMD ["node", "dist/index.js"]
