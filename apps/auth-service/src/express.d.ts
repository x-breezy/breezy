// we need to declare this file to extend the Express Request interface with our custom user property from the jwt
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string; permissions: string[] }
    }
  }
}

export {}
