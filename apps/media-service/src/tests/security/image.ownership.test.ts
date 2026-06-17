import express, { type Request, type Response, type NextFunction } from "express"
import request from "supertest"
import { createImageRouter } from "../../routes/image.route"
import { verifyJwt } from "../../utils/jwt"
import { ImageModel } from "../../models/image.model"

jest.mock("../../utils/jwt")
jest.mock("../../models/image.model", () => ({
  ImageModel: {
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}))

const mockVerifyJwt = verifyJwt as jest.MockedFunction<typeof verifyJwt>
const mockImageModel = ImageModel as jest.Mocked<typeof ImageModel>

const ALICE_ID = "11111111-1111-1111-1111-111111111111"
const BOB_ID = "22222222-2222-2222-2222-222222222222"
const IMAGE_ID = "507f1f77bcf86cd799439011"

function buildApp() {
  const app = express()
  app.use("/images", createImageRouter())
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ success: false, error: "Internal server error" })
  })
  return app
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(mockImageModel.findByIdAndDelete as jest.Mock).mockReturnValue({
    exec: jest.fn().mockResolvedValue({ _id: IMAGE_ID }),
  })
})

describe("DELETE /images/:id — ownership enforcement", () => {
  it("allows owner to delete their own image", async () => {
    mockVerifyJwt.mockReturnValue({ sub: ALICE_ID, role: "user" })
    ;(mockImageModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: IMAGE_ID, ownerId: ALICE_ID }),
    })

    const res = await request(buildApp())
      .delete(`/images/${IMAGE_ID}`)
      .set("Authorization", "Bearer token")

    expect(res.status).toBe(200)
  })

  it("allows moderator to delete any image", async () => {
    mockVerifyJwt.mockReturnValue({ sub: ALICE_ID, role: "moderator" })
    ;(mockImageModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: IMAGE_ID, ownerId: BOB_ID }),
    })

    const res = await request(buildApp())
      .delete(`/images/${IMAGE_ID}`)
      .set("Authorization", "Bearer token")

    expect(res.status).toBe(200)
  })

  it("allows admin to delete any image", async () => {
    mockVerifyJwt.mockReturnValue({ sub: ALICE_ID, role: "admin" })
    ;(mockImageModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: IMAGE_ID, ownerId: BOB_ID }),
    })

    const res = await request(buildApp())
      .delete(`/images/${IMAGE_ID}`)
      .set("Authorization", "Bearer token")

    expect(res.status).toBe(200)
  })

  it("denies non-owner user with 403", async () => {
    mockVerifyJwt.mockReturnValue({ sub: ALICE_ID, role: "user" })
    ;(mockImageModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: IMAGE_ID, ownerId: BOB_ID }),
    })

    const res = await request(buildApp())
      .delete(`/images/${IMAGE_ID}`)
      .set("Authorization", "Bearer token")

    expect(res.status).toBe(403)
  })

  it("returns 404 when image does not exist", async () => {
    mockVerifyJwt.mockReturnValue({ sub: ALICE_ID, role: "user" })
    ;(mockImageModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    })

    const res = await request(buildApp())
      .delete(`/images/${IMAGE_ID}`)
      .set("Authorization", "Bearer token")

    expect(res.status).toBe(404)
  })

  it("returns 401 when no auth header", async () => {
    const res = await request(buildApp()).delete(`/images/${IMAGE_ID}`)
    expect(res.status).toBe(401)
  })

  it("returns 401 when JWT is invalid", async () => {
    mockVerifyJwt.mockImplementation(() => {
      throw new Error("Invalid token")
    })

    const res = await request(buildApp())
      .delete(`/images/${IMAGE_ID}`)
      .set("Authorization", "Bearer bad-token")

    expect(res.status).toBe(401)
  })
})
