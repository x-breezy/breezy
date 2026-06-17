import express, { type Request, type Response, type NextFunction } from "express"
import request from "supertest"
import { createVideoRouter } from "../../routes/video.route"
import { verifyJwt } from "../../utils/jwt"
import { VideoModel } from "../../models/video.model"

jest.mock("../../utils/jwt")
jest.mock("../../models/video.model", () => ({
  VideoModel: {
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}))

const mockVerifyJwt = verifyJwt as jest.MockedFunction<typeof verifyJwt>
const mockVideoModel = VideoModel as jest.Mocked<typeof VideoModel>

const ALICE_ID = "11111111-1111-1111-1111-111111111111"
const BOB_ID = "22222222-2222-2222-2222-222222222222"
const VIDEO_ID = "507f1f77bcf86cd799439011"

function buildApp() {
  const app = express()
  app.use("/videos", createVideoRouter())
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ success: false, error: "Internal server error" })
  })
  return app
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(mockVideoModel.findByIdAndDelete as jest.Mock).mockReturnValue({
    exec: jest.fn().mockResolvedValue({ _id: VIDEO_ID }),
  })
})

describe("DELETE /videos/:id ownership enforcement", () => {
  it("allows owner to delete their own video", async () => {
    mockVerifyJwt.mockReturnValue({ sub: ALICE_ID, role: "user" })
    ;(mockVideoModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: VIDEO_ID, ownerId: ALICE_ID }),
    })

    const res = await request(buildApp())
      .delete(`/videos/${VIDEO_ID}`)
      .set("Authorization", "Bearer token")

    expect(res.status).toBe(200)
  })

  it("allows moderator to delete any video", async () => {
    mockVerifyJwt.mockReturnValue({ sub: ALICE_ID, role: "moderator" })
    ;(mockVideoModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: VIDEO_ID, ownerId: BOB_ID }),
    })

    const res = await request(buildApp())
      .delete(`/videos/${VIDEO_ID}`)
      .set("Authorization", "Bearer token")

    expect(res.status).toBe(200)
  })

  it("allows admin to delete any video", async () => {
    mockVerifyJwt.mockReturnValue({ sub: ALICE_ID, role: "admin" })
    ;(mockVideoModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: VIDEO_ID, ownerId: BOB_ID }),
    })

    const res = await request(buildApp())
      .delete(`/videos/${VIDEO_ID}`)
      .set("Authorization", "Bearer token")

    expect(res.status).toBe(200)
  })

  it("denies non-owner user with 403", async () => {
    mockVerifyJwt.mockReturnValue({ sub: ALICE_ID, role: "user" })
    ;(mockVideoModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: VIDEO_ID, ownerId: BOB_ID }),
    })

    const res = await request(buildApp())
      .delete(`/videos/${VIDEO_ID}`)
      .set("Authorization", "Bearer token")

    expect(res.status).toBe(403)
  })

  it("returns 404 when video does not exist", async () => {
    mockVerifyJwt.mockReturnValue({ sub: ALICE_ID, role: "user" })
    ;(mockVideoModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    })

    const res = await request(buildApp())
      .delete(`/videos/${VIDEO_ID}`)
      .set("Authorization", "Bearer token")

    expect(res.status).toBe(404)
  })

  it("returns 401 when no auth header", async () => {
    const res = await request(buildApp()).delete(`/videos/${VIDEO_ID}`)
    expect(res.status).toBe(401)
  })

  it("returns 401 when JWT is invalid", async () => {
    mockVerifyJwt.mockImplementation(() => {
      throw new Error("Invalid token")
    })

    const res = await request(buildApp())
      .delete(`/videos/${VIDEO_ID}`)
      .set("Authorization", "Bearer bad-token")

    expect(res.status).toBe(401)
  })
})
