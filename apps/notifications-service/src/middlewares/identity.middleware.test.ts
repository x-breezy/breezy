import type { Request, Response, NextFunction } from "express"
import { identity } from "./identity.middleware"
import { PERMISSIONS } from "../constants/permissions"
import { verifyJwt } from "../utils/jwt"

jest.mock("../utils/jwt")
const mockVerifyJwt = verifyJwt as jest.MockedFunction<typeof verifyJwt>

function mockReqRes(headers: Record<string, string> = {}) {
  const req = { headers, user: undefined } as unknown as Request
  const json = jest.fn()
  const res = { status: jest.fn().mockReturnThis(), json } as unknown as Response
  const next: NextFunction = jest.fn()
  return { req, res, next }
}

describe("identity middleware", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 401 when Authorization header is missing", () => {
    const { req, res, next } = mockReqRes()
    identity(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Unauthorized" })
    expect(next).not.toHaveBeenCalled()
  })

  it("sets req.user with id and permissions when token present", () => {
    mockVerifyJwt.mockReturnValue({ sub: "u1", role: "user" })
    const { req, res, next } = mockReqRes({ authorization: "Bearer fake-token" })
    identity(req, res, next)
    expect(next).toHaveBeenCalled()
    expect(req.user).toMatchObject({ id: "u1", role: "user" })
    expect(req.user!.permissions).toContain(PERMISSIONS.NOTIFICATION_READ)
    expect(req.user!.permissions).toContain(PERMISSIONS.NOTIFICATION_DELETE)
  })

  it("sets empty permissions when role is absent from token", () => {
    mockVerifyJwt.mockReturnValue({ sub: "u1", role: undefined as unknown as string })
    const { req, res, next } = mockReqRes({ authorization: "Bearer fake-token" })
    identity(req, res, next)
    expect(next).toHaveBeenCalled()
    expect(req.user!.role).toEqual(undefined)
    expect(req.user!.permissions).toEqual([])
  })

  it("sets role from JWT payload", () => {
    mockVerifyJwt.mockReturnValue({ sub: "u1", role: "admin" })
    const { req, res, next } = mockReqRes({ authorization: "Bearer fake-token" })
    identity(req, res, next)
    expect(req.user!.role).toEqual("admin")
  })
})
