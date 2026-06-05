import type { Request, Response, NextFunction } from "express"
import { identity } from "../../middlewares/identity.middleware"
import { requireOwnership } from "../../middlewares/owner.middleware"
import ImageController from "../../controllers/image.controller"
import ImageService from "../../services/image.service"

function mockReq(overrides: object = {}): Request {
  return { headers: {}, body: {}, params: {}, user: undefined, ...overrides } as unknown as Request
}

function mockRes(): { status: jest.Mock; json: jest.Mock } & Response {
  const res = { status: jest.fn(), json: jest.fn() } as unknown as { status: jest.Mock; json: jest.Mock } & Response
  res.status.mockReturnValue(res)
  return res
}

// ─── identity ─────────────────────────────────────────────────────────────────

describe("identity", () => {
  it("sets empty roles when x-roles header is absent", () => {
    const req = mockReq({ headers: { "x-user-id": "user-1" } })
    const res = mockRes()
    const next = jest.fn() as unknown as NextFunction

    identity(req, res, next)

    expect((req as unknown as { user: { roles: string[] } }).user.roles).toEqual([])
    expect(next).toHaveBeenCalled()
  })

  it("returns 401 when x-user-id is absent", () => {
    const req = mockReq({ headers: {} })
    const res = mockRes()
    const next = jest.fn() as unknown as NextFunction

    identity(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })
})

// ─── requireOwnership ─────────────────────────────────────────────────────────

describe("requireOwnership", () => {
  it("returns 403 when req.user is undefined (optional chain branch)", async () => {
    const model = {
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ownerId: "user-1" }),
      }),
    }
    const req = mockReq({ params: { id: "abc" }, user: undefined })
    const res = mockRes()
    const next = jest.fn() as unknown as NextFunction

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await requireOwnership(model as any, "admin")(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })
})

// ─── ImageController — header validation (lines 24-28) ───────────────────────

describe("ImageController.uploadImage header validation", () => {
  it("returns 400 when content-type header fails Zod validation", async () => {
    const mockService = {
      uploadImage: jest.fn(),
    } as unknown as ImageService

    const controller = new ImageController(mockService)

    const req = mockReq({
      body: Buffer.from("imagedata"),
      headers: { "content-type": "" },
      user: { id: "user-1", roles: ["user"] },
    })
    const res = mockRes()
    const next = jest.fn() as unknown as NextFunction

    await controller.uploadImage(req as unknown as Parameters<typeof controller.uploadImage>[0], res as unknown as Parameters<typeof controller.uploadImage>[1], next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: expect.any(String) })
    )
    expect(mockService.uploadImage).not.toHaveBeenCalled()
  })
})
