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
      if (!call.request?.profileId) {
        cb({ code: grpc.status.INVALID_ARGUMENT, message: "Profile ID is required" }, null)
        return
      }

      const result = await svc.getFollowers(call.request.profileId)
      cb(null, { count: result.count, followers: result.followers })
    } catch (err) {
      const error = err as Error
      console.error("Error in getFollowers:", error)
      cb(
        {
          code: grpc.status.INTERNAL,
          message: error.message || "Internal server error",
        },
        null
      )
    }
  },

  async getFollowing(call: any, cb: any) {
    try {
      if (!call.request?.profileId) {
        cb({ code: grpc.status.INVALID_ARGUMENT, message: "Profile ID is required" }, null)
        return
      }

      const result = await svc.getFollowing(call.request.profileId)
      cb(null, { count: result.count, following: result.following })
    } catch (err) {
      const error = err as Error
      console.error("Error in getFollowing:", error)
      cb(
        {
          code: grpc.status.INTERNAL,
          message: error.message || "Internal server error",
        },
        null
      )
    }
  },

  async getProfile(call: any, cb: any) {
    try {
      if (!call.request?.profileId) {
        cb({ code: grpc.status.INVALID_ARGUMENT, message: "Profile ID is required" }, null)
        return
      }

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
        role: result.role ?? "user",
      })
    } catch (err) {
      const error = err as Error
      console.error("Error in getProfile:", error)
      cb(
        {
          code: grpc.status.INTERNAL,
          message: error.message || "Internal server error",
        },
        null
      )
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
