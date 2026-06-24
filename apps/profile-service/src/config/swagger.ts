import swaggerJsdoc from "swagger-jsdoc"
import path from "node:path"

const __dirnamePosix = __dirname.replace(/\\/g, "/")

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "profile-service",
      version: "1.0.0",
      description: "HTTP microservice for managing profile credentials and authentication.",
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
        Profile: {
          type: "object",
          properties: {
            profileId: {
              type: "string",
              format: "uuid",
              example: "550e8400-e29b-41d4-a716-446655440000",
            },
            username: { type: "string", example: "johndoe" },
            firstName: { type: "string", nullable: true, example: "John" },
            lastName: { type: "string", nullable: true, example: "Doe" },
            bio: { type: "string", nullable: true, example: "Hello!" },
            role: { type: "string", example: "user" },
            avatarId: { type: "string", nullable: true, example: "https://example.com/avatar.jpg" },
            followersCount: { type: "integer", example: 42 },
            followingCount: { type: "integer", example: 21 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateProfileInput: {
          type: "object",
          required: ["username"],
          properties: {
            username: { type: "string", minLength: 1, maxLength: 100, example: "johndoe" },
            firstName: { type: "string", nullable: true, example: "John" },
            lastName: { type: "string", nullable: true, example: "Doe" },
            bio: { type: "string", nullable: true, example: "Hello!" },
            avatarId: { type: "string", nullable: true, example: "https://example.com/avatar.jpg" },
          },
        },
        UpdateProfileInput: {
          type: "object",
          properties: {
            firstName: { type: "string", nullable: true, example: "John" },
            lastName: { type: "string", nullable: true, example: "Doe" },
            bio: { type: "string", nullable: true, example: "Updated bio" },
            avatarId: { type: "string", nullable: true, example: "https://example.com/avatar.jpg" },
          },
        },
        FollowInput: {
          type: "object",
          required: ["followingId"],
          properties: {
            followingId: {
              type: "string",
              format: "uuid",
              example: "550e8400-e29b-41d4-a716-446655440000",
            },
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
