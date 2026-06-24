import swaggerJsdoc from "swagger-jsdoc"
import path from "node:path"

const __dirnamePosix = __dirname.replace(/\\/g, "/")

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "post-service",
      version: "1.0.0",
      description: "HTTP microservice for creating and serving posts.",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ApiError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string", example: "Not found" },
          },
        },
        MediaItem: {
          type: "object",
          properties: {
            id: { type: "string" },
            type: { type: "string", enum: ["image", "video"] },
          },
          example: { id: "media_abc123", type: "image" },
        },
        ProfileRef: {
          type: "object",
          properties: {
            id: { type: "string" },
            username: { type: "string" },
            avatarId: { type: "string", nullable: true },
            firstName: { type: "string", nullable: true },
            lastName: { type: "string", nullable: true },
            role: { type: "string" },
          },
        },
        Post: {
          type: "object",
          properties: {
            id: { type: "string", example: "abc123" },
            content: { type: "string", example: "Hello world!" },
            authorId: { type: "string", example: "user_42" },
            tags: { type: "array", items: { type: "string" }, example: ["news", "tech"] },
            mentions: { type: "array", items: { type: "string" }, example: ["user_42"] },
            media: { type: "array", items: { $ref: "#/components/schemas/MediaItem" } },
            parentId: { type: "string", nullable: true, example: null },
            rootParentId: { type: "string", nullable: true, example: null },
            likesCount: { type: "integer", example: 0 },
            commentsCount: { type: "integer", example: 0 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        PostDetail: {
          allOf: [{ $ref: "#/components/schemas/Post" }],
          type: "object",
          properties: {
            author: { $ref: "#/components/schemas/ProfileRef" },
            replies: { type: "array", items: { $ref: "#/components/schemas/Post" } },
            likes: { type: "integer", example: 0 },
            isLiked: { type: "boolean", example: false },
          },
        },
        PaginatedPosts: {
          type: "object",
          properties: {
            data: { type: "array", items: { $ref: "#/components/schemas/Post" } },
            total: { type: "integer", example: 100 },
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 20 },
          },
        },
        TrendingTag: {
          type: "object",
          properties: {
            tag: { type: "string", example: "tech" },
            count: { type: "integer", example: 42 },
          },
        },
      },
    },
  },
  apis: [
    path.posix.join(__dirnamePosix, "../routes/*.ts"),
    path.posix.join(__dirnamePosix, "../routes/*.js"),
  ],
}

export const swaggerSpec = swaggerJsdoc(options)
