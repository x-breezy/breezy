import * as grpc from "@grpc/grpc-js"
import * as protoLoader from "@grpc/proto-loader"
import path from "path"
import ImageService from "../services/image.service"
import VideoService from "../services/video.service"

const PROTO_PATH = path.resolve(__dirname, "./data/media.service.proto")
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any
const mediaData = protoDescriptor.media.data

const imageService = new ImageService()
const videoService = new VideoService()

const mediaDataHandler = {
  async deleteMedia(call: any, cb: any) {
    const items: { id: string; type: string }[] = call.request?.items ?? []
    await Promise.allSettled(
      items.map((item) =>
        item.type === "image" ? imageService.deleteImage(item.id) : videoService.delete(item.id)
      )
    )
    cb(null, { success: true })
  },
}

export function startGrpcServer(port = 50052): void {
  const server = new grpc.Server()
  server.addService(mediaData.MediaData.service, mediaDataHandler)
  server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
    if (err) throw err
    console.log(`gRPC server listening on port ${boundPort}`)
  })
}
