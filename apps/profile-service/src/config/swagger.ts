import swaggerJsdoc from "swagger-jsdoc"
import path from "node:path"

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "profile-service",
      version: "1.0.0",
      description: "HTTP microservice for managing profile credentials and authentication.",
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
        Profile: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid", example: "550e8400-e29b-41d4-a716-446655440000" },
            profilename: { type: "string", example: "johndoe" },
            email: { type: "string", format: "email", example: "john@example.com" },
            isVerified: { type: "boolean", example: false },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateProfileInput: {
          type: "object",
          required: ["profilename", "email", "passwordHash"],
          properties: {
            profilename: { type: "string", minLength: 3, maxLength: 50, example: "johndoe" },
            email: { type: "string", format: "email", example: "john@example.com" },
            passwordHash: { type: "string", example: "$2b$10$..." },
          },
        },
        UpdateProfileInput: {
          type: "object",
          properties: {
            profilename: { type: "string", minLength: 3, maxLength: 50, example: "johndoe_updated" },
            passwordHash: { type: "string", example: "$2b$10$..." },
            isVerified: { type: "boolean", example: true },
          },
        },
      },
    },
  },
  apis: [path.join(__dirname, "../routes/*.{ts,js}")],
}

export const swaggerSpec = swaggerJsdoc(options)
