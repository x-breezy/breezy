declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: import("./constants/roles").Role; permissions: string[] }
    }
  }
}

export {}
