import swaggerJsdoc from "swagger-jsdoc"
import path from "node:path"

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "message-service",
      version: "1.0.0",
      description: "HTTP microservice for private messaging.",
    },
    components: {
      schemas: {
        ApiError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string", example: "Not found" },
          },
        },
        Post: {
          type: "object",
          properties: {
            id: { type: "string", example: "abc123" },
            content: { type: "string", example: "Hello world!" },
            authorId: { type: "string", example: "user_42" },
            tags: { type: "array", items: { type: "string" }, example: ["news", "tech"] },
            media: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  type: { type: "string", enum: ["image", "video"] },
                },
              },
              example: [{ id: "media_abc123", type: "image" }],
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
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
      },
    },
  },
  apis: [path.join(__dirname, "../routes/*.{ts,js}")],
}

export const swaggerSpec = swaggerJsdoc(options)
