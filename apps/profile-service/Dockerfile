FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/ ./packages/
COPY apps/profile-service/ ./apps/profile-service/
RUN npm ci --workspace=profile-service
RUN npm run build --workspace=profile-service
RUN mkdir -p /app/apps/profile-service/dist/config/data && \
    cp /app/apps/profile-service/src/config/data/profile.data.proto \
       /app/apps/profile-service/dist/config/data/profile.data.proto

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/profile-service/dist ./apps/profile-service/dist
COPY --from=builder /app/apps/profile-service/package.json ./apps/profile-service/package.json
WORKDIR /app/apps/profile-service
CMD ["node", "dist/index.js"]
