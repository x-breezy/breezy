/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable turbo/no-undeclared-env-vars */
import * as grpc from "@grpc/grpc-js"
import * as protoLoader from "@grpc/proto-loader"
import path from "path"

const PROTO_PATH = path.resolve(__dirname, "../config/data/post.service.proto")
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any
const profileData = protoDescriptor.profile.data

export interface FollowGraphPort {
  getFollowing(viewerId: string): Promise<string[] | null>
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const TIMEOUT_MS = 2000

export class GrpcFollowGraph implements FollowGraphPort {
  private readonly client: any

  constructor() {
    this.client = new profileData.ProfileData(
      process.env.PROFILE_SERVICE_GRPC_URL ?? "localhost:50051",
      grpc.credentials.createInsecure()
    )
  }

  async getFollowing(viewerId: string): Promise<string[] | null> {
    if (!UUID_RE.test(viewerId)) return null
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), TIMEOUT_MS)
      this.client.getFollowing({ profileId: viewerId }, (err: any, res: any) => {
        clearTimeout(timer)
        resolve(err ? null : res.following)
      })
    })
  }
}
