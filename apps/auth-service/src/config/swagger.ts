import swaggerJsdoc from "swagger-jsdoc"
import path from "node:path"

const __dirnamePosix = __dirname.replace(/\\/g, "/")

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "auth-service",
      version: "1.0.0",
      description: "HTTP microservice for authentication and user management.",
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
            error: { type: "string", example: "Unauthorized" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            username: { type: "string", example: "johndoe" },
            email: { type: "string", format: "email" },
            role: { type: "string", example: "user" },
            isBanned: { type: "boolean", example: false },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                token: { type: "string", example: "eyJhbGci..." },
                refreshToken: { type: "string", example: "dGhpcyBpcyBhIHJlZnJlc2gtdG9rZW4..." },
                user: { $ref: "#/components/schemas/User" },
              },
            },
          },
        },
        Report: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            reporterId: { type: "string", format: "uuid" },
            reportedUserId: { type: "string", format: "uuid" },
            reason: { type: "string", example: "Spam" },
            status: { type: "string", enum: ["pending", "resolved"], example: "pending" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
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
