# Breezy

**A full-stack social platform built as a microservices monorepo.**

[![CI](https://github.com/x-breezy/breezy/actions/workflows/pull-request.yml/badge.svg)](https://github.com/x-breezy/breezy/actions/workflows/pull-request.yml)
[![codecov](https://codecov.io/gh/x-breezy/breezy/branch/dev/graph/badge.svg)](https://codecov.io/gh/x-breezy/breezy)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)

Breezy lets users post short-form content, follow each other, react to posts, and receive real-time notifications. It is structured as a Turborepo monorepo with independent microservices, each owning its own database.

---

## Features

- Short-form posts (250 chars), nested comments, and likes
- Follow graph with a personalized feed
- Media uploads with image processing and video streaming (range request support)
- Real-time notifications over Server-Sent Events
- Two-factor authentication and Google OAuth
- Role-based access control (visitor, user, moderator, admin)
- Centralized structured logging shipped to Kibana via Filebeat

---

## Getting Started

**Prerequisites:** Node.js 20+, Docker, npm

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

The web app is available at `http://localhost:3000`. The API is accessible at `http://localhost/api`.

---

## Services

| Service | Port | gRPC | Database | Description |
| --- | --- | --- | --- | --- |
| Nginx Gateway | 80 | | | Single entry point. Handles auth, routing, rate limiting. |
| Web (Next.js) | 3000 | | | React 19 frontend with App Router. |
| `auth-service` | 4000 | | PostgreSQL | Registration, login, 2FA, Google OAuth, JWT management. |
| `profile-service` | 4010 | 50051 | PostgreSQL | Profiles, bios, avatars, follow relationships. |
| `post-service` | 4040 | | MongoDB | Posts, comments, likes, feed, search. |
| `media-service` | 4050 | 50052 | MongoDB (GridFS) | Image processing and video streaming. |
| `notifications-service` | 4060 | | MongoDB | Email delivery and real-time push via SSE. |

**Shared infrastructure:** RabbitMQ (async events between services), Redis (refresh token and session storage in auth service). Rate limiting is handled by Nginx in-memory zones.

**Inter-service communication:** gRPC for synchronous calls (profile service serves the follow graph to post service; media service exposes batch delete to post service). RabbitMQ for event-driven flows (auth, profile, and post services publish events consumed by the notifications service).

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Zustand, TanStack Query |
| Backend services | Node.js, Express, TypeScript |
| Relational data | PostgreSQL + Sequelize |
| Document data | MongoDB + Mongoose |
| Inter-service RPC | gRPC (`@grpc/grpc-js`) |
| Async messaging | RabbitMQ (`amqplib`) |
| Session store | Redis (`ioredis`) |
| Gateway | Nginx |
| Logging | Pino, Filebeat, Elasticsearch, Kibana |
| Monorepo | Turborepo |
| CI | GitHub Actions |

---

## API Documentation

Generate the OpenAPI spec (aggregated from JSDoc across all services):

```bash
npm run generate:openapi
```

Interactive Swagger UI is available at `http://localhost/api-docs` when the stack is running.

Run the full endpoint test suite (41 endpoints):

```bash
npm run test:api
```

---

## Permissions

The gateway enforces role-based access on every request. Roles are embedded in the JWT and forwarded as a header to each service.

| Role | Description |
| --- | --- |
| `visitor` | Unauthenticated. Can register and access public endpoints only. |
| `user` | Authenticated account holder. Full access to social features on own content. |
| `moderator` | Can act on any content and suspend abusive accounts. |
| `admin` | All moderator powers, plus permanent bans and account creation. |

<details>
<summary>Full permission matrix</summary>

| Permission | user | moderator | admin |
| --- | :---: | :---: | :---: |
| `post:create` | yes | yes | yes |
| `post:read` | yes | yes | yes |
| `post:read:any` | | yes | yes |
| `post:update:own` | yes | yes | yes |
| `post:update:any` | | yes | yes |
| `post:delete:own` | yes | yes | yes |
| `post:delete:any` | | yes | yes |
| `comment:create` | yes | yes | yes |
| `comment:delete:own` | yes | yes | yes |
| `comment:delete:any` | | yes | yes |
| `like:create` | yes | yes | yes |
| `like:delete:own` | yes | yes | yes |
| `profile:read` | yes | yes | yes |
| `profile:update:own` | yes | yes | yes |
| `profile:delete:own` | yes | yes | yes |
| `follow:create` | yes | yes | yes |
| `follow:delete:own` | yes | yes | yes |
| `user:suspend` | | yes | yes |
| `user:ban` | | | yes |

</details>

---

## Observability

Logs from all services are written to a shared volume, picked up by Filebeat, and indexed into Elasticsearch.

Open Kibana at `http://localhost:5601` to explore logs.

If logs stop appearing after restarting services, reset the Filebeat registry:

```bash
docker exec breezy-filebeat rm -rf /usr/share/filebeat/data/registry
docker restart breezy-filebeat
```

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start all services in watch mode |
| `npm run build` | Build all apps and packages |
| `npm run test` | Run the full test suite |
| `npm run lint` | Lint all workspaces |
| `npm run check-types` | TypeScript type checking across all packages |
| `npm run generate:openapi` | Generate `openapi.json` from service annotations |
| `npm run test:api` | Integration test all 41 API endpoints |
| `npm run seed` | Seed databases with development data |
