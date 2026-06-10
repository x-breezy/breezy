import swaggerJsdoc from "swagger-jsdoc"
import path from "node:path"

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "media-service",
      version: "1.0.0",
      description:
        "HTTP microservice for storing and serving images and videos via MongoDB (images) and GridFS (videos).",
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
        ImageMeta: {
          type: "object",
          properties: {
            id: { type: "string", example: "abc123" },
            originalName: { type: "string", example: "photo.jpg" },
            mimeType: { type: "string", example: "image/jpeg" },
            size: { type: "integer", example: 204800 },
            width: { type: "integer", example: 1920 },
            height: { type: "integer", example: 1080 },
            ownerId: { type: "string", example: "user_42" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Video: {
          type: "object",
          properties: {
            id: { type: "string", example: "def456" },
            gridFsId: { type: "string", example: "gridfs_789" },
            originalName: { type: "string", example: "clip.mp4" },
            mimeType: { type: "string", example: "video/mp4" },
            size: { type: "integer", example: 10485760 },
            duration: { type: "number", example: 120.5 },
            width: { type: "integer", example: 1920 },
            height: { type: "integer", example: 1080 },
            title: { type: "string", example: "My clip" },
            ownerId: { type: "string", example: "user_42" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
  apis: [path.join(__dirname, "../routes/*.{ts,js}")],
}

export const swaggerSpec = swaggerJsdoc(options)
