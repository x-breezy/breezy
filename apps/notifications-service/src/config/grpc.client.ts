import * as grpc from "@grpc/grpc-js"
import * as protoLoader from "@grpc/proto-loader"
import path from "path"

const PROTO_PATH = path.resolve(
  __dirname,
  "../../../profile-service/src/config/data/profile.data.proto"
)

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any
const ProfileData = protoDescriptor.profile.data.ProfileData

const client = new ProfileData(
  "host.docker.internal:50051",
  grpc.credentials.createInsecure()
)

export interface ActorProfile {
  username: string
  avatarId: string
  firstName: string
  lastName: string
}

export function getActorProfile(actorId: string): Promise<ActorProfile | null> {
  return new Promise((resolve) => {
    client.getProfile({ profileId: actorId }, (err: Error | null, res: ActorProfile) => {
      if (err) {
        resolve(null)
        return
      }
      resolve(res)
    })
  })
}
