import mongoose from "mongoose"

/** Open the shared Mongoose connection. Idempotent. */
export async function connect(uri: string): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return mongoose
  return mongoose.connect(uri)
}

/** Close the shared connection. */
export async function disconnect(): Promise<void> {
  await mongoose.disconnect()
}
