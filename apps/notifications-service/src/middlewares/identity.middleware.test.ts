import type { Request, Response, NextFunction } from "express"
import { identity } from "./identity.middleware"
import { PERMISSIONS } from "../constants/permissions"

function mockReqRes(headers: Record<string, string> = {}) {
  const req = { headers, user: undefined } as unknown as Request
  const json = jest.fn()
  const res = { status: jest.fn().mockReturnThis(), json } as unknown as Response
  const next: NextFunction = jest.fn()
  return { req, res, next }
}

describe("identity middleware", () => {
  it("returns 401 when x-user-id header is missing", () => {
    const { req, res, next } = mockReqRes()
    identity(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Unauthorized" })
    expect(next).not.toHaveBeenCalled()
  })

  it("sets req.user with id and permissions when header present", () => {
    const { req, res, next } = mockReqRes({ "x-user-id": "u1", "x-role": "user" })
    identity(req, res, next)
    expect(next).toHaveBeenCalled()
    expect(req.user).toMatchObject({ id: "u1", role: "user" })
    expect(req.user!.permissions).toContain(PERMISSIONS.NOTIFICATION_READ)
    expect(req.user!.permissions).toContain(PERMISSIONS.NOTIFICATION_DELETE)
  })

  it("sets empty role when x-role header missing", () => {
    const { req, res, next } = mockReqRes({ "x-user-id": "u1" })
    identity(req, res, next)
    expect(next).toHaveBeenCalled()
    expect(req.user!.role).toEqual(undefined)
    expect(req.user!.permissions).toEqual([])
  })

  it("parses comma-separated role", () => {
    const { req, res, next } = mockReqRes({ "x-user-id": "u1", "x-role": "admin" })
    identity(req, res, next)
    expect(req.user!.role).toEqual("admin")
  })
})
