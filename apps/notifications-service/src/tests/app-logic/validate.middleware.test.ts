import type { Request, Response, NextFunction } from "express"
import { z } from "zod"
import { validate } from "../../middlewares/validate.middleware"

function mockReqRes(data: unknown, target: "body" | "params" | "query" = "body") {
  const req = { [target]: data } as unknown as Request
  const json = jest.fn()
  const res = { status: jest.fn().mockReturnThis(), json } as unknown as Response
  const next: NextFunction = jest.fn()
  return { req, res, next }
}

const schema = z.object({ name: z.string().min(1), age: z.coerce.number().int().min(0) })

describe("validate middleware", () => {
  it("calls next with valid body data", () => {
    const { req, res, next } = mockReqRes({ name: "alice", age: 30 })
    validate(schema, "body")(req, res, next)
    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it("returns 400 on invalid body", () => {
    const { req, res, next } = mockReqRes({ name: "", age: -1 })
    validate(schema, "body")(req, res, next)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: expect.any(String) })
    )
    expect(next).not.toHaveBeenCalled()
  })

  it("returns 400 when required field is missing", () => {
    const { req, res, next } = mockReqRes({ age: 10 })
    validate(schema, "body")(req, res, next)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it("replaces req[target] with parsed/coerced data", () => {
    const { req, res, next } = mockReqRes({ name: "bob", age: "25" }, "query")
    validate(schema, "query")(req, res, next)
    expect(next).toHaveBeenCalled()
    expect((req as unknown as Record<string, unknown>).query).toMatchObject({
      name: "bob",
      age: 25,
    })
  })

  it("validates params target", () => {
    const paramSchema = z.object({ id: z.string().min(1) })
    const { req, res, next } = mockReqRes({ id: "" }, "params")
    validate(paramSchema, "params")(req, res, next)
    expect(res.status).toHaveBeenCalledWith(400)
  })
})
