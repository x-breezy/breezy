import * as grpc from "@grpc/grpc-js"
import * as protoLoader from "@grpc/proto-loader"
import path from "path"
import { createLogger } from "@breezy/logger"

const PROTO_PATH = path.resolve(__dirname, "../config/data/media.service.proto")

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any
const MediaData = protoDescriptor.media.data.MediaData

const GRPC_URL = process.env.MEDIA_SERVICE_GRPC_URL ?? "localhost:50052"
const client = new MediaData(GRPC_URL, grpc.credentials.createInsecure())

const logger = createLogger({ service: "post-service" })

export interface MediaItem {
  id: string
  type: "image" | "video"
}

export function deleteMediaItems(items: MediaItem[]): Promise<void> {
  if (items.length === 0) return Promise.resolve()
  const deadline = new Date(Date.now() + 3000)
  return new Promise((resolve) => {
    client.deleteMedia({ items }, { deadline }, (err: Error | null) => {
      if (err) {
        logger.warn({ err: err.message, count: items.length }, "gRPC deleteMedia failed")
      }
      resolve()
    })
  })
}
