import swaggerJsdoc from "swagger-jsdoc"
import path from "node:path"

const __dirnamePosix = __dirname.replace(/\\/g, "/")

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "message-service",
      version: "1.0.0",
      description: "HTTP microservice for private messaging.",
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
        ReplyTo: {
          type: "object",
          properties: {
            _id: { type: "string" },
            content: { type: "string" },
            senderName: { type: "string" },
          },
        },
        Message: {
          type: "object",
          properties: {
            id: { type: "string" },
            conversationId: { type: "string" },
            senderId: { type: "string", format: "uuid" },
            content: { type: "string" },
            isSystem: { type: "boolean", example: false },
            replyTo: { $ref: "#/components/schemas/ReplyTo" },
            readAt: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Conversation: {
          type: "object",
          properties: {
            id: { type: "string" },
            participantIds: { type: "array", items: { type: "string", format: "uuid" } },
            isGroup: { type: "boolean", example: false },
            name: { type: "string", nullable: true },
            lastMessage: { type: "string", nullable: true },
            lastMessageSenderId: { type: "string", nullable: true },
            lastMessageAt: { type: "string", format: "date-time", nullable: true },
            deletedBy: { type: "array", items: { type: "string" } },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateConversationInput: {
          type: "object",
          properties: {
            recipientId: { type: "string", format: "uuid" },
            recipientIds: { type: "array", items: { type: "string", format: "uuid" } },
            name: { type: "string" },
          },
          description: "Provide either recipientId or recipientIds (array).",
        },
        SendMessageInput: {
          type: "object",
          required: ["content"],
          properties: {
            content: { type: "string", minLength: 1, maxLength: 2000, example: "Hello!" },
            replyTo: { $ref: "#/components/schemas/ReplyTo" },
          },
        },
        RenameConversationInput: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 100, example: "New group name" },
          },
        },
        AddMembersInput: {
          type: "object",
          required: ["memberIds"],
          properties: {
            memberIds: { type: "array", items: { type: "string", format: "uuid" }, minItems: 1 },
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
