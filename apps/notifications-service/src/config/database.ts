import mongoose from "mongoose"

export async function connect(uri: string): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return mongoose
  return mongoose.connect(uri)
}

export async function disconnect(): Promise<void> {
  await mongoose.disconnect()
}
