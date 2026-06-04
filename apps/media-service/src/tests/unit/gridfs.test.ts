/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose"

jest.mock("mongoose", () => ({
  connection: { db: null },
  mongo: {
    GridFSBucket: jest.fn(),
    ObjectId: jest.fn((id: string) => ({ id })),
  },
}))

// Access mocks through the imported module to avoid const hoisting issues.
import { getBucket, toObjectId } from "../../config/gridfs"

const mockGridFSBucket = mongoose.mongo.GridFSBucket as jest.Mock
const mockObjectId = mongoose.mongo.ObjectId as jest.Mock

describe("getBucket", () => {
  afterEach(() => {
    ;(mongoose.connection as any).db = null
  })

  it("throws when mongoose is not connected (db is null)", () => {
    ;(mongoose.connection as any).db = null
    expect(() => getBucket("videos")).toThrow("MongoDB not connected")
  })

  it("returns a GridFSBucket when connected", () => {
    const fakeDb = {}
    ;(mongoose.connection as any).db = fakeDb
    mockGridFSBucket.mockReturnValue({ fake: true })

    const bucket = getBucket("videos")

    expect(mockGridFSBucket).toHaveBeenCalledWith(fakeDb, { bucketName: "videos" })
    expect(bucket).toEqual({ fake: true })
  })
})

describe("toObjectId", () => {
  it("delegates to mongoose.mongo.ObjectId", () => {
    const result = toObjectId("abc123")
    expect(mockObjectId).toHaveBeenCalledWith("abc123")
    expect(result).toEqual({ id: "abc123" })
  })
})
