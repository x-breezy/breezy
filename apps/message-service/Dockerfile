FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/ ./packages/
COPY apps/message-service/ ./apps/message-service/
COPY apps/profile-service/src/config/data/ ./apps/profile-service/src/config/data/
RUN npm ci --workspace=message-service
RUN npm run build --workspace=message-service

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/message-service/dist ./apps/message-service/dist
COPY --from=builder /app/apps/message-service/node_modules ./apps/message-service/node_modules
COPY --from=builder /app/apps/message-service/package.json ./apps/message-service/package.json
COPY --from=builder /app/apps/profile-service/src/config/data/profile.data.proto ./apps/profile-service/src/config/data/profile.data.proto
WORKDIR /app/apps/message-service
CMD ["node", "dist/index.js"]
