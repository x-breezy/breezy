import { generateKeyPairSync, randomBytes } from "crypto"
import { writeFileSync, unlinkSync, existsSync, mkdtempSync, rmSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

// Set env vars before importing the module so loadPem reads them
const keyPair = generateKeyPairSync("rsa", { modulusLength: 2048 })
const privatePem = keyPair.privateKey.export({ type: "pkcs1", format: "pem" })
const publicPem = keyPair.publicKey.export({ type: "spki", format: "pem" })

process.env.JWT_PRIVATE_KEY = privatePem
process.env.JWT_PUBLIC_KEY = publicPem
process.env.JWT_SECRET = "test-secret-key-for-jwt-tests"
process.env.JWT_KID = "test-key-1"

import {
  signToken,
  verifyToken,
  signPendingToken,
  verifyPendingToken,
  signPendingGoogleToken,
  verifyPendingGoogleToken,
  generateRefreshToken,
  hashRefreshToken,
  getJwks,
  REFRESH_TOKEN_TTL_MS,
} from "../../utils/jwt.util"
import type { Role } from "../../constants/roles"

afterAll(() => {
  delete process.env.JWT_PRIVATE_KEY
  delete process.env.JWT_PUBLIC_KEY
  delete process.env.JWT_PUBLIC_KEY_PATH
  delete process.env.JWT_SECRET
  delete process.env.JWT_KID
  delete process.env.JWT_EXPIRES_IN
})

describe("signToken / verifyToken (RS256)", () => {
  it("signs and verifies a token", () => {
    const claims = { sub: "user-1", role: "user" as Role }
    const token = signToken(claims)
    expect(token).toEqual(expect.any(String))

    const payload = verifyToken(token)
    expect(payload.sub).toBe("user-1")
    expect(payload.role).toBe("user")
    expect(payload.jti).toBeDefined()
  })

  it("signs admin role token", () => {
    const token = signToken({ sub: "admin-1", role: "admin" as Role })
    const payload = verifyToken(token)
    expect(payload.role).toBe("admin")
  })

  it("throws on invalid token", () => {
    expect(() => verifyToken("bad-token")).toThrow()
  })

  it("uses custom JWT_KID", () => {
    const token = signToken({ sub: "user-1", role: "user" as Role })
    const decoded = require("jsonwebtoken").decode(token, { complete: true })
    expect(decoded.header.kid).toBe("test-key-1")
  })
})

describe("loadPem - env var path", () => {
  it("reads from JWT_PUBLIC_KEY env var and verifies tokens", () => {
    process.env.JWT_PUBLIC_KEY = publicPem
    const token = signToken({ sub: "user-1", role: "user" as Role })
    const payload = verifyToken(token)
    expect(payload.sub).toBe("user-1")
  })
})

describe("loadPem - triple-quote stripping", () => {
  beforeAll(() => {
    const quoted = `"""${publicPem.replace(/\n/g, "\\n")}"""`
    process.env.JWT_PUBLIC_KEY = quoted
    process.env.JWT_PRIVATE_KEY = `"""${privatePem.replace(/\n/g, "\\n")}"""`
  })

  afterAll(() => {
    process.env.JWT_PUBLIC_KEY = publicPem
    process.env.JWT_PRIVATE_KEY = privatePem
  })

  it("strips triple quotes and \\n from env var", () => {
    const token = signToken({ sub: "user-1", role: "user" as Role })
    const payload = verifyToken(token)
    expect(payload.sub).toBe("user-1")
  })
})

describe("loadPem - file path", () => {
  let tmpDir: string
  let pubKeyPath: string
  let privKeyPath: string

  beforeAll(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "jwt-test-"))
    pubKeyPath = join(tmpDir, "public.pem")
    privKeyPath = join(tmpDir, "private.pem")
    writeFileSync(pubKeyPath, publicPem)
    writeFileSync(privKeyPath, privatePem)
    process.env.JWT_PUBLIC_KEY_PATH = pubKeyPath
    process.env.JWT_PRIVATE_KEY_PATH = privKeyPath
    delete process.env.JWT_PUBLIC_KEY
    delete process.env.JWT_PRIVATE_KEY
  })

  afterAll(() => {
    delete process.env.JWT_PUBLIC_KEY_PATH
    delete process.env.JWT_PRIVATE_KEY_PATH
    process.env.JWT_PUBLIC_KEY = publicPem
    process.env.JWT_PRIVATE_KEY = privatePem
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true })
  })

  it("reads PEM from file path", () => {
    const token = signToken({ sub: "file-test", role: "user" as Role })
    const payload = verifyToken(token)
    expect(payload.sub).toBe("file-test")
  })
})

describe("getPendingSecret", () => {
  it("uses JWT_SECRET for pending tokens", () => {
    const token = signPendingToken("user-1")
    const userId = verifyPendingToken(token)
    expect(userId).toBe("user-1")
  })

  it("uses 'changeme' in non-production when secret is 'changeme'", () => {
    delete process.env.JWT_SECRET
    const token = signPendingToken("user-1")
    const userId = verifyPendingToken(token)
    expect(userId).toBe("user-1")
    process.env.JWT_SECRET = "test-secret-key-for-jwt-tests"
  })

  it("throws when purpose is wrong", () => {
    const jwt = require("jsonwebtoken")
    const badToken = jwt.sign(
      { sub: "user-1", purpose: "wrong" },
      "test-secret-key-for-jwt-tests",
      {
        expiresIn: "10m",
      }
    )
    expect(() => verifyPendingToken(badToken)).toThrow("Invalid token purpose")
  })
})

describe("signPendingGoogleToken / verifyPendingGoogleToken", () => {
  const googleClaims = {
    googleId: "google-123",
    email: "google@example.com",
    emailVerified: true,
    firstName: "John",
    lastName: "Doe",
    picture: "https://example.com/avatar.jpg",
  }

  it("signs and verifies a google pending token", () => {
    const token = signPendingGoogleToken(googleClaims)
    const claims = verifyPendingGoogleToken(token)
    expect(claims.googleId).toBe("google-123")
    expect(claims.email).toBe("google@example.com")
    expect(claims.emailVerified).toBe(true)
    expect(claims.firstName).toBe("John")
    expect(claims.lastName).toBe("Doe")
    expect(claims.picture).toBe("https://example.com/avatar.jpg")
  })

  it("throws when purpose is wrong", () => {
    const jwt = require("jsonwebtoken")
    const badToken = jwt.sign(
      { googleId: "x", email: "x@x.com", purpose: "wrong" },
      "test-secret-key-for-jwt-tests",
      { expiresIn: "15m" }
    )
    expect(() => verifyPendingGoogleToken(badToken)).toThrow("Invalid token purpose")
  })

  it("handles missing optional fields", () => {
    const minimalClaims = {
      googleId: "google-456",
      email: "minimal@example.com",
      emailVerified: false,
    }
    const token = signPendingGoogleToken(minimalClaims)
    const claims = verifyPendingGoogleToken(token)
    expect(claims.googleId).toBe("google-456")
    expect(claims.emailVerified).toBe(false)
    expect(claims.firstName).toBeUndefined()
  })
})

describe("generateRefreshToken / hashRefreshToken", () => {
  it("generates a 64-char hex string", () => {
    const token = generateRefreshToken()
    expect(token).toMatch(/^[a-f0-9]{64}$/)
  })

  it("generates unique tokens each time", () => {
    const a = generateRefreshToken()
    const b = generateRefreshToken()
    expect(a).not.toBe(b)
  })

  it("produces deterministic hash", () => {
    const token = generateRefreshToken()
    const hash1 = hashRefreshToken(token)
    const hash2 = hashRefreshToken(token)
    expect(hash1).toBe(hash2)
  })

  it("produces different hashes for different tokens", () => {
    const hashA = hashRefreshToken("token-a")
    const hashB = hashRefreshToken("token-b")
    expect(hashA).not.toBe(hashB)
  })
})

describe("getJwks", () => {
  it("returns JWKS with one key", () => {
    const jwks = getJwks()
    expect(jwks.keys).toHaveLength(1)
    const key = jwks.keys[0] as Record<string, unknown>
    expect(key.kid).toBe("test-key-1")
    expect(key.alg).toBe("RS256")
    expect(key.use).toBe("sig")
    expect(key.kty).toBeDefined()
  })
})

describe("REFRESH_TOKEN_TTL_MS", () => {
  it("defaults to 7 days", () => {
    expect(REFRESH_TOKEN_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000)
  })
})
