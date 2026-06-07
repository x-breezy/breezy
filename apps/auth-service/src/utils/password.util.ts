import { randomBytes, scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

const scryptAsync = promisify(scrypt)

const KEYLEN = 64
const SALT_BYTES = 16

/**
 * Hash a plain password with scrypt. Output: "<saltHex>:<hashHex>".
 * A fresh random salt is generated per call, so the same password yields different hashes.
 */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString("hex")
  const derived = (await scryptAsync(plain, salt, KEYLEN)) as Buffer
  return `${salt}:${derived.toString("hex")}`
}

/**
 * Verify a plain password against a stored "<saltHex>:<hashHex>" hash.
 * Constant-time comparison to avoid timing attacks. Returns false on malformed input.
 */
export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(":")
  if (!salt || !hashHex) return false

  const expected = Buffer.from(hashHex, "hex")
  const derived = (await scryptAsync(plain, salt, KEYLEN)) as Buffer

  if (expected.length !== derived.length) return false
  return timingSafeEqual(expected, derived)
}
