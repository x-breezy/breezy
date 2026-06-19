FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/ ./packages/
COPY apps/post-service/ ./apps/post-service/
COPY apps/profile-service/src/config/data/ ./apps/profile-service/src/config/data/
RUN npm ci --workspace=post-service
RUN npm run build --workspace=post-service
RUN mkdir -p /app/apps/post-service/dist/config/data && \
    cp /app/apps/post-service/src/config/data/post.service.proto \
       /app/apps/post-service/dist/config/data/post.service.proto && \
    cp /app/apps/post-service/src/config/data/media.service.proto \
       /app/apps/post-service/dist/config/data/media.service.proto

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/post-service/dist ./apps/post-service/dist
COPY --from=builder /app/apps/post-service/package.json ./apps/post-service/package.json
COPY --from=builder /app/apps/profile-service/src/config/data/profile.data.proto ./apps/profile-service/src/config/data/profile.data.proto
WORKDIR /app/apps/post-service
CMD ["node", "dist/index.js"]
