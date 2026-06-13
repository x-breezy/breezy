import * as grpc from "@grpc/grpc-js"
import * as protoLoader from "@grpc/proto-loader"
import path from "path"
import ProfileService from "../services/profile.service"

const PROTO_PATH = path.resolve(__dirname, "./data/profile.data.proto")
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any
const profileData = protoDescriptor.profile.data

const svc = new ProfileService()

const profileDataHandler = {
  async getFollowers(call: any, cb: any) {
    try {
      const result = await svc.getFollowers(call.request.profileId)
      cb(null, { count: result.count, followers: result.followers })
    } catch (err) {
      cb(err as Error, null)
    }
  },

  async getFollowing(call: any, cb: any) {
    try {
      const result = await svc.getFollowing(call.request.profileId)
      cb(null, { count: result.count, following: result.following })
    } catch (err) {
      cb(err as Error, null)
    }
  },

  async createProfile(call: any, cb: any) {
    try {
      const result = await svc.createProfile({
        profileId: call.request.profileId,
        username: call.request.username,
        role: call.request.role,
        firstName: call.request.firstName || null,
        lastName: call.request.lastName || null,
        avatarId: call.request.avatarUrl || null,
      })
      cb(null, { profileId: result.profileId })
    } catch (err) {
      cb(err as Error, null)
    }
  },

  async getProfile(call: any, cb: any) {
    try {
      const result = await svc.getProfile(call.request.profileId)
      if (!result) {
        cb({ code: grpc.status.NOT_FOUND, message: "Profile not found" }, null)
        return
      }
      cb(null, {
        username: result.username,
        avatarId: result.avatarId ?? "",
        firstName: result.firstName ?? "",
        lastName: result.lastName ?? "",
      })
    } catch (err) {
      cb(err as Error, null)
    }
  },
}

export function startGrpcServer(port = 50051): void {
  const server = new grpc.Server()
  server.addService(profileData.ProfileData.service, profileDataHandler as any)
  server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
    if (err) throw err
    console.log(`gRPC server listening on port ${boundPort}`)
  })
}
