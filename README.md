# Breezy

## Getting started

in the root: `npm install`

make sure you have: `npm install turbo --global`

and then: `npm run dev`

## Micro-services

- `auth`: who you are (credentials) - PostgreSQL
- `users`: how you connect (social graph and profile) - PostgreSQL
- `posts`: what you do (content) - MongoDB + Elasticsearch
- `media`: what you share (files) - S3 + MongoDB
  <!--- `notifications`: what you get (alerts) - MongoDB -->
  <!--- `feed`: what you see (content feed) - MongoDB -->

## API Gateway

The API Gateway is the single entry point for all client requests. It handles authentication,
routing, and response aggregation. It also enforces permissions based on user role.

It add to the request:

- `userId`: the ID of the authenticated user, if any.
- `role`: the role assigned to the authenticated user, if any.

## Permissions

### Roles

| Role          | Description                                                                  |
| ------------- | ---------------------------------------------------------------------------- |
| **visitor**   | Unauthenticated. Can only register (Fx1) and view public themes (Fx23).      |
| **user**      | Authenticated account holder. Full access to social features on own content. |
| **moderator** | Elevated user. Can act on any content and suspend abusive accounts.          |
| **admin**     | Full control. All moderator powers plus permanent bans and account creation. |

---

### Post service (`apps/post-service`)

| Permission           | String               | Description                                                         |
| -------------------- | -------------------- | ------------------------------------------------------------------- |
| `POST_CREATE`        | `post:create`        | Publish a new post (Fx3, max 280 chars).                            |
| `POST_READ`          | `post:read`          | Read posts on own profile and followed-users feed (Fx4, Fx5, Fx11). |
| `POST_READ_ANY`      | `post:read:any`      | Read any post regardless of author, used for moderation review.     |
| `POST_UPDATE_OWN`    | `post:update:own`    | Edit own post content or tags (Fx4, Fx12).                          |
| `POST_UPDATE_ANY`    | `post:update:any`    | Edit any post, e.g. to remove policy-violating content (Fx21).      |
| `POST_DELETE_OWN`    | `post:delete:own`    | Delete own post (Fx4).                                              |
| `POST_DELETE_ANY`    | `post:delete:any`    | Delete any post as a moderation action (Fx21).                      |
| `COMMENT_CREATE`     | `comment:create`     | Reply to a post or to another comment (Fx7, Fx8).                   |
| `COMMENT_DELETE_OWN` | `comment:delete:own` | Delete own comment.                                                 |
| `COMMENT_DELETE_ANY` | `comment:delete:any` | Delete any comment as a moderation action (Fx21).                   |
| `LIKE_CREATE`        | `like:create`        | Like a post (Fx6).                                                  |
| `LIKE_DELETE_OWN`    | `like:delete:own`    | Remove own like from a post (unlike).                               |

---

### Profile service (`apps/profile-service`)

| Permission           | String               | Description                                                                    |
| -------------------- | -------------------- | ------------------------------------------------------------------------------ |
| `PROFILE_READ`       | `profile:read`       | View any user profile page, including bio, avatar, and post list (Fx10, Fx11). |
| `PROFILE_UPDATE_OWN` | `profile:update:own` | Edit own bio, display name, and avatar (Fx10).                                 |
| `PROFILE_DELETE_OWN` | `profile:delete:own` | Permanently delete own account and all associated data.                        |
| `FOLLOW_CREATE`      | `follow:create`      | Follow another user to add their posts to the feed (Fx9).                      |
| `FOLLOW_DELETE_OWN`  | `follow:delete:own`  | Unfollow a user (Fx9).                                                         |
| `USER_SUSPEND`       | `user:suspend`       | Temporarily suspend an account, preventing login (Fx21). Moderator and above.  |
| `USER_BAN`           | `user:ban`           | Permanently ban an account (Fx21). Admin only.                                 |

---

### Role matrix

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

Visitors have no permissions. They can only reach the registration endpoint (public) and the login
endpoint (public).

## API Documentation

### Generate OpenAPI spec

```bash
npm run generate:openapi
```

This creates `openapi.json` at the root by aggregating JSDoc annotations from all microservices.

### Swagger UI

Access interactive docs at: http://localhost/api-docs/

### Test all endpoints

```bash
npm run test:api
```

Automatically tests all 41 endpoints with a generated user, reports:

- ✅ Pass: valid responses (200, 201, 400, 401, 403, 404, 429)
- ❌ Fail: unexpected errors (500, 502)
- ⏭ Skip: internal endpoints

### Troubleshooting Filebeat

If logs stop appearing in Kibana after restarting services:

```bash
# Reset Filebeat registry (it tracks which files have been read)
docker exec breezy-filebeat rm -rf /usr/share/filebeat/data/registry
docker restart breezy-filebeat
```

### Known API bugs

| Endpoint                                | Error | Issue                                   |
| --------------------------------------- | ----- | --------------------------------------- |
| `GET /api/posts/{id}`                   | 500   | Should return 404 when post not found   |
| `DELETE /api/posts/{id}`                | 502   | Service crashes on invalid ID           |
| `POST/DELETE /api/posts/{postId}/likes` | 502   | Service crashes when post doesn't exist |

These are `post-service` bugs (not Swagger). The endpoints work correctly with valid IDs.

# Voir les logs dans Kibana

open http://localhost:5601

# Reset Filebeat si besoin

docker exec breezy-filebeat rm -rf /usr/share/filebeat/data/registry docker restart breezy-filebeat

# Compter les logs indexés

curl http://localhost:9200/breezy-logs-\*/\_count

pensé a mettre une erreur si on créer un user avec un username de 2 caractères, min 3
