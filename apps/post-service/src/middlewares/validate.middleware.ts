import type { Request, Response, NextFunction } from "express"
import { z } from "zod"

export function validate(schema: z.ZodTypeAny, target: "body" | "params" | "query" = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target])
    if (!result.success) {
      res
        .status(400)
        .json({ success: false, error: result.error.errors[0]?.message ?? "Invalid request" })
      return
    }
    req[target] = result.data
    next()
  }
}
