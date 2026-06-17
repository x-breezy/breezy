import * as grpc from "@grpc/grpc-js"
import * as protoLoader from "@grpc/proto-loader"
import path from "path"

const PROTO_PATH = path.resolve(
  __dirname,
  "../../../media-service/src/config/data/media.service.proto"
)

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
        console.warn("[media-grpc] deleteMedia failed:", err.message)
      }
      resolve()
    })
  })
}
