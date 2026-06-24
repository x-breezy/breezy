import swaggerJsdoc from "swagger-jsdoc"
import path from "node:path"

const __dirnamePosix = __dirname.replace(/\\/g, "/")

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "notifications-service",
      version: "1.0.0",
      description: "HTTP microservice for managing user notifications.",
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
        Notification: {
          type: "object",
          properties: {
            id: { type: "string" },
            userId: { type: "string", format: "uuid" },
            type: { type: "string", enum: ["follow", "like", "mention", "comment", "reply"] },
            read: { type: "boolean", example: false },
            payload: { type: "object" },
            createdAt: { type: "string", format: "date-time" },
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
