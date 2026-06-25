# Breezy

**A full-stack social platform built as a microservices monorepo.**

[![CI](https://github.com/x-breezy/breezy/actions/workflows/pull-request.yml/badge.svg)](https://github.com/x-breezy/breezy/actions/workflows/pull-request.yml)
[![codecov](https://codecov.io/gh/x-breezy/breezy/branch/dev/graph/badge.svg)](https://codecov.io/gh/x-breezy/breezy)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

Breezy lets users post short-form content, follow each other, react to posts, exchange private
messages, and receive real-time notifications. It is structured as a Turborepo monorepo with
independent microservices, each owning its own database.

---

## Features

- Short-form posts (250 chars), nested comments, and likes
- Follow graph with a personalized feed
- Media uploads with image processing and video streaming (range request support)
- Private messaging: 1-to-1 and group conversations with real-time delivery over WebSocket
  (Socket.io)
- Message features: reply threads, shared post/profile previews, read receipts, infinite scroll
  history
- Real-time notifications over Server-Sent Events and Web Push
- Two-factor authentication and Google OAuth
- Role-based access control (visitor, user, moderator, admin)
- Centralized structured logging shipped to Kibana via Filebeat

---

## Getting Started

**Prerequisites:** Node.js 18+, Docker, npm

```bash
npm install -g turbo

git clone https://github.com/x-breezy/breezy.git
cd breezy
npm install

# Start infrastructure (databases, RabbitMQ, Redis)
docker compose up -d

# Start all services in development mode
npm run dev
```

The web app is available at `http://localhost:3000`. The API is accessible at
`http://localhost/api`.

---

## Services

| Service                 | Port | gRPC  | Database         | Description                                                          |
| ----------------------- | ---- | ----- | ---------------- | -------------------------------------------------------------------- |
| Nginx Gateway           | 80   |       |                  | Single entry point. Handles auth, routing, rate limiting.            |
| Web (Next.js)           | 3000 |       |                  | React 19 frontend with App Router.                                   |
| `auth-service`          | 4020 |       | PostgreSQL       | Registration, login, 2FA, Google OAuth, JWT management.              |
| `profile-service`       | 4010 | 50051 | PostgreSQL       | Profiles, bios, avatars, follow relationships.                       |
| `post-service`          | 4040 |       | MongoDB          | Posts, comments, likes, feed, search.                                |
| `media-service`         | 4050 | 50052 | MongoDB (GridFS) | Image processing and video streaming.                                |
| `message-service`       | 4030 |       | MongoDB          | Private conversations, real-time messaging via Socket.io, WebSocket. |
| `notifications-service` | 4060 |       | MongoDB          | Email delivery, real-time push via SSE, and Web Push notifications.  |

**Shared infrastructure:** RabbitMQ (async events between services), Redis (refresh token and
session storage in auth service). Rate limiting is handled by Nginx in-memory zones.

**Inter-service communication:** gRPC for synchronous calls (profile service serves the follow graph
to post service; media service exposes batch delete to post service). RabbitMQ for event-driven
flows (auth, profile, post, and message services publish events consumed by the notifications
service). Socket.io (WebSocket) for real-time bidirectional messaging in the message service.

---

## Tech Stack

| Layer             | Technology                                                                      |
| ----------------- | ------------------------------------------------------------------------------- |
| Frontend          | Next.js 16, React 19, Tailwind CSS 4, Zustand, TanStack Query, Socket.io-client |
| Backend services  | Node.js, Express, TypeScript                                                    |
| Relational data   | PostgreSQL + Sequelize                                                          |
| Document data     | MongoDB + Mongoose                                                              |
| Inter-service RPC | gRPC (`@grpc/grpc-js`)                                                          |
| Async messaging   | RabbitMQ (`amqplib`)                                                            |
| Session store     | Redis (`ioredis`)                                                               |
| Gateway           | Nginx                                                                           |
| Logging           | Pino, Promtail, Loki, Grafana                                                   |
| Metrics           | Prometheus, Grafana                                                             |
| Tracing           | OpenTelemetry, Jaeger                                                           |
| Monorepo          | Turborepo                                                                       |
| CI                | GitHub Actions                                                                  |

---

## API Documentation

Generate the OpenAPI spec (aggregated from JSDoc across all services):

```bash
npm run generate:openapi
```

Interactive Swagger UI is available at `http://localhost/api-docs` when the stack is running.

Run the full endpoint test suite:

```bash
npm run test:api
```

---

## Permissions

The gateway enforces role-based access on every request. Roles are embedded in the JWT and forwarded
as a header to each service.

| Role        | Description                                                                  |
| ----------- | ---------------------------------------------------------------------------- |
| `visitor`   | Unauthenticated. Can register and access public endpoints only.              |
| `user`      | Authenticated account holder. Full access to social features on own content. |
| `moderator` | Can act on any content and suspend abusive accounts.                         |
| `admin`     | All moderator powers, plus permanent bans and account creation.              |

<details>
<summary>Full permission matrix</summary>

| Permission           | user | moderator | admin |
| -------------------- | :--: | :-------: | :---: |
| `post:create`        | yes  |    yes    |  yes  |
| `post:read`          | yes  |    yes    |  yes  |
| `post:read:any`      |      |    yes    |  yes  |
| `post:update:own`    | yes  |    yes    |  yes  |
| `post:update:any`    |      |    yes    |  yes  |
| `post:delete:own`    | yes  |    yes    |  yes  |
| `post:delete:any`    |      |    yes    |  yes  |
| `comment:create`     | yes  |    yes    |  yes  |
| `comment:delete:own` | yes  |    yes    |  yes  |
| `comment:delete:any` |      |    yes    |  yes  |
| `like:create`        | yes  |    yes    |  yes  |
| `like:delete:own`    | yes  |    yes    |  yes  |
| `profile:read`       | yes  |    yes    |  yes  |
| `profile:update:own` | yes  |    yes    |  yes  |
| `profile:delete:own` | yes  |    yes    |  yes  |
| `follow:create`      | yes  |    yes    |  yes  |
| `follow:delete:own`  | yes  |    yes    |  yes  |
| `user:suspend`       |      |    yes    |  yes  |
| `user:ban`           |      |           |  yes  |

</details>

---

## Observability

**Logs:** Each service writes structured JSON logs with Pino to a shared volume. Promtail tails that
volume and ships entries to Loki. Grafana is used to explore logs and dashboards.

**Metrics:** Every service exposes a `/metrics` endpoint scraped by Prometheus. Dashboards are
visualised in Grafana at `http://grafana.localhost` (dev) or the configured `GRAFANA_DOMAIN` (prod).

**Tracing:** Services are instrumented with OpenTelemetry and export traces to Jaeger via OTLP. Set
`OTEL_ENABLED=true` to activate tracing in any service.

---

## Scripts

| Command                    | Description                                      |
| -------------------------- | ------------------------------------------------ |
| `npm run dev`              | Start all services in watch mode                 |
| `npm run build`            | Build all apps and packages                      |
| `npm run test`             | Run the full test suite                          |
| `npm run lint`             | Lint all workspaces                              |
| `npm run check-types`      | TypeScript type checking across all packages     |
| `npm run generate:openapi` | Generate `openapi.json` from service annotations |
| `npm run test:api`         | Integration test all API endpoints               |
| `npm run seed`             | Seed databases with development data             |
