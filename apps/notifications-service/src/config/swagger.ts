import swaggerJsdoc from "swagger-jsdoc"
import path from "node:path"

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "notifications-service",
      version: "1.0.0",
      description: "HTTP microservice for managing user notifications.",
    },
  },
  apis: [path.join(__dirname, "../routes/*.{ts,js}")],
}

export const swaggerSpec = swaggerJsdoc(options)
