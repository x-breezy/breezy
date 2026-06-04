# media-service

HTTP microservice for storing and serving images and videos. Images are stored as raw binary
documents in MongoDB. Videos are streamed directly into GridFS with HTTP range support.

Interactive API docs are available at `http://localhost:4050/docs` when the service is running. The
raw OpenAPI spec is served at `http://localhost:4050/docs.json`.

## Configuration

| Variable      | Default                            | Description                 |
| ------------- | ---------------------------------- | --------------------------- |
| `PORT`        | `4050`                             | Port the service listens on |
| `MONGODB_URI` | `mongodb://localhost:27017/breezy` | MongoDB connection string   |
| `LOG_LEVEL`   | `debug`                            | Log verbosity               |

## Image API

Base path: `/images`

All responses follow `{ success: boolean, data?: T, error?: string }`.

### Upload an image

```
POST /images
```

Send raw binary in the body. No multipart encoding.

**Required headers:**

| Header         | Description                                |
| -------------- | ------------------------------------------ |
| `Content-Type` | MIME type of the image (e.g. `image/jpeg`) |

**Optional headers:**

| Header       | Description                              |
| ------------ | ---------------------------------------- |
| `X-Filename` | Original filename (defaults to `upload`) |
| `X-Owner-Id` | Owner identifier                         |

**Limits:** 16 MB maximum body size.

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "originalName": "photo.jpg",
    "mimeType": "image/jpeg",
    "size": 204800,
    "width": 1920,
    "height": 1080,
    "ownerId": "user_42",
    "createdAt": "2026-06-03T10:00:00.000Z",
    "updatedAt": "2026-06-03T10:00:00.000Z"
  }
}
```

Raw bytes are not included in the response. Fetch them via `GET /images/:id`.

### Get image bytes

```
GET /images/:id
```

Returns raw binary with the original `Content-Type` header set. Suitable as an `<img src="...">`
target.

**Response:** `200 OK` with binary body, or `404` if not found.

### Get image metadata

```
GET /images/:id/meta
```

Returns the same shape as the upload response without transferring bytes.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": { "id": "abc123", "mimeType": "image/jpeg", "...": "..." }
}
```

### Delete an image

```
DELETE /images/:id
```

**Response:** `200 OK`

```json
{ "success": true, "data": null }
```

---

## Video API

Base path: `/videos`

Videos are piped directly from the request stream into GridFS without buffering the full body in
memory.

### Upload a video

```
POST /videos
```

Stream the raw binary body directly. No multipart encoding. The request body is piped straight into
GridFS.

**Required headers:**

| Header         | Description                               |
| -------------- | ----------------------------------------- |
| `Content-Type` | MIME type of the video (e.g. `video/mp4`) |

**Optional headers:**

| Header       | Description                              |
| ------------ | ---------------------------------------- |
| `X-Filename` | Original filename (defaults to `upload`) |
| `X-Owner-Id` | Owner identifier                         |
| `X-Title`    | Human-readable title                     |

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "def456",
    "gridFsId": "gridfs_789",
    "originalName": "clip.mp4",
    "mimeType": "video/mp4",
    "size": 10485760,
    "title": "My clip",
    "ownerId": "user_42",
    "createdAt": "2026-06-03T10:00:00.000Z",
    "updatedAt": "2026-06-03T10:00:00.000Z"
  }
}
```

### Stream a video

```
GET /videos/:id
```

Streams raw video bytes. Supports the `Range` header for seeking (HTTP 206 Partial Content).
Suitable as an HTML5 `<video src="...">` target.

**Response:** `200 OK` (full) or `206 Partial Content` (ranged), with `Accept-Ranges: bytes` set.

### Get video metadata

```
GET /videos/:id/meta
```

Returns video metadata as JSON without transferring bytes.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": { "id": "def456", "mimeType": "video/mp4", "...": "..." }
}
```

### Delete a video

```
DELETE /videos/:id
```

**Response:** `200 OK`

```json
{ "success": true, "data": null }
```
