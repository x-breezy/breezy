import * as grpc from "@grpc/grpc-js"
import * as protoLoader from "@grpc/proto-loader"
import path from "path"

const PROTO_PATH = path.resolve(__dirname, "../config/data/profile.data.proto")
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any
const profileData = protoDescriptor.profile.data

export interface ProfileClientPort {
  createProfile(profileId: string, username: string): Promise<string | null>
}

const TIMEOUT_MS = 2000

export class GrpcProfileClient implements ProfileClientPort {
  private readonly client: any

  constructor() {
    this.client = new profileData.ProfileData(
      process.env.PROFILE_SERVICE_GRPC_URL ?? "localhost:50051",
      grpc.credentials.createInsecure()
    )
  }

  async createProfile(profileId: string, username: string): Promise<string | null> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), TIMEOUT_MS)
      this.client.createProfile({ profileId, username }, (err: any, res: any) => {
        clearTimeout(timer)
        resolve(err ? null : res.profileId)
      })
    })
  }
}
