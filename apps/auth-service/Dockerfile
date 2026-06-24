FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/ ./packages/
COPY apps/auth-service/ ./apps/auth-service/
COPY apps/profile-service/src/config/data/ ./apps/profile-service/src/config/data/
RUN npm ci --workspace=auth-service
RUN npm run build --workspace=auth-service
RUN mkdir -p /app/apps/auth-service/dist/config/data && \
    cp /app/apps/profile-service/src/config/data/profile.data.proto \
       /app/apps/auth-service/dist/config/data/profile.data.proto

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/auth-service/dist ./apps/auth-service/dist
COPY --from=builder /app/apps/auth-service/package.json ./apps/auth-service/package.json
WORKDIR /app/apps/auth-service
CMD ["node", "dist/index.js"]
