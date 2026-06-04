import type { Request, Response, NextFunction } from "express"
import { z } from "zod"
import { requireRoles, requireSelfOrRoles } from "../../middlewares/roles.middleware"
import { identity } from "../../middlewares/identity.middleware"
import { validate } from "../../middlewares/validate.middleware"
import { PostController } from "../../controllers/post.controller"
import { LikeController } from "../../controllers/like.controller"
import { CommentController } from "../../controllers/comment.controller"

function mockReq(overrides: object = {}): Request {
  return { headers: {}, body: {}, params: {}, user: undefined, ...overrides } as unknown as Request
}

function mockRes(): { status: jest.Mock; json: jest.Mock } & Response {
  const res = { status: jest.fn(), json: jest.fn() } as unknown as { status: jest.Mock; json: jest.Mock } & Response
  res.status.mockReturnValue(res)
  return res
}

// ─── requireRoles ─────────────────────────────────────────────────────────────

describe("requireRoles", () => {
  it("calls next when user carries an allowed role", () => {
    const req = mockReq({ user: { id: "u1", roles: ["admin"] } })
    const res = mockRes()
    const next = jest.fn() as unknown as NextFunction

    requireRoles("admin")(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it("calls next when user carries one of several allowed roles", () => {
    const req = mockReq({ user: { id: "u1", roles: ["moderator"] } })
    const res = mockRes()
    const next = jest.fn() as unknown as NextFunction

    requireRoles("admin", "moderator")(req, res, next)

    expect(next).toHaveBeenCalled()
  })

  it("returns 403 when user lacks all allowed roles", () => {
    const req = mockReq({ user: { id: "u1", roles: ["user"] } })
    const res = mockRes()
    const next = jest.fn() as unknown as NextFunction

    requireRoles("admin", "moderator")(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Forbidden" })
    expect(next).not.toHaveBeenCalled()
  })

  it("returns 403 when user has no roles", () => {
    const req = mockReq({ user: { id: "u1", roles: [] } })
    const res = mockRes()
    const next = jest.fn() as unknown as NextFunction

    requireRoles("admin")(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it("returns 403 when req.user is undefined (unauthenticated call)", () => {
    const req = mockReq({ user: undefined })
    const res = mockRes()
    const next = jest.fn() as unknown as NextFunction

    requireRoles("admin")(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
  })
})

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

  it("sets empty roles when x-roles is not a string (e.g. absent)", () => {
    const req = mockReq({ headers: { "x-user-id": "user-1", "x-roles": undefined } })
    const res = mockRes()
    const next = jest.fn() as unknown as NextFunction

    identity(req, res, next)

    expect((req as unknown as { user: { roles: string[] } }).user.roles).toEqual([])
  })

  it("parses comma-separated roles from x-roles header", () => {
    const req = mockReq({ headers: { "x-user-id": "user-1", "x-roles": "admin,moderator" } })
    const res = mockRes()
    const next = jest.fn() as unknown as NextFunction

    identity(req, res, next)

    expect((req as unknown as { user: { roles: string[] } }).user.roles).toEqual(["admin", "moderator"])
  })
})

// ─── validate ─────────────────────────────────────────────────────────────────

describe("validate", () => {
  it("calls next and sets req.body when schema passes", () => {
    const schema = z.object({ content: z.string() })
    const req = mockReq({ body: { content: "hello" } })
    const res = mockRes()
    const next = jest.fn() as unknown as NextFunction

    validate(schema)(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(req.body).toEqual({ content: "hello" })
  })

  it("returns 400 with Zod error message on failure", () => {
    const schema = z.object({ content: z.string().min(1) })
    const req = mockReq({ body: { content: "" } })
    const res = mockRes()
    const next = jest.fn() as unknown as NextFunction

    validate(schema)(req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: expect.any(String) })
    )
    expect(next).not.toHaveBeenCalled()
  })

  it("uses fallback message when Zod errors array is empty", () => {
    const schema = {
      safeParse: jest.fn().mockReturnValue({ success: false, error: { errors: [] } }),
    } as unknown as z.ZodTypeAny
    const req = mockReq({ body: {} })
    const res = mockRes()
    const next = jest.fn() as unknown as NextFunction

    validate(schema)(req, res, next)

    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Invalid request" })
  })
})

// ─── requireSelfOrRoles ───────────────────────────────────────────────────────

describe("requireSelfOrRoles", () => {
  it("returns 403 when req.user is undefined", () => {
    const req = mockReq({ user: undefined, params: { userId: "u1" } })
    const res = mockRes()
    const next = jest.fn() as unknown as NextFunction

    requireSelfOrRoles("userId", "admin")(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })
})

// ─── Controller default service injection ────────────────────────────────────

describe("controller constructors", () => {
  it("PostController can be instantiated without a service argument", () => {
    expect(() => new PostController()).not.toThrow()
  })

  it("LikeController can be instantiated without a service argument", () => {
    expect(() => new LikeController()).not.toThrow()
  })

  it("CommentController can be instantiated without a service argument", () => {
    expect(() => new CommentController()).not.toThrow()
  })
})
