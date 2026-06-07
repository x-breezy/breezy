import swaggerJsdoc from "swagger-jsdoc"
import path from "node:path"

const options: swaggerJsdoc.Options = {
  definition: {
    info: {
      title: "Breezy Auth Service API",
      version: "1.0.0",
      description: "API documentation for the Breezy Auth Service",
    },
  },
  apis: [path.join(__dirname, "../routes/*.{ts,js}")],
}

export const swaggerSpec = swaggerJsdoc(options)
