import mongoose from "mongoose"
import type { GridFSBucket, ObjectId } from "mongodb"

/**
 * Open a GridFS bucket on the shared Mongoose connection. A bucket creates two
 * collections (`<name>.files` + `<name>.chunks`) and streams large binaries
 * past the 16MB document cap. Requires an open connection.
 */
export function getBucket(bucketName: string): GridFSBucket {
  const db = mongoose.connection.db
  if (!db) throw new Error("MongoDB not connected")
  return new mongoose.mongo.GridFSBucket(db, { bucketName })
}

/** Parse a hex id into an ObjectId. Throws on malformed input. */
export function toObjectId(id: string): ObjectId {
  return new mongoose.mongo.ObjectId(id)
}
