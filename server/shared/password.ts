import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hex] = stored.split(":")
  if (!salt || !hex || hex.length !== 128) return false
  const actual = scryptSync(password, salt, 64)
  const expected = Buffer.from(hex, "hex")
  return expected.length === actual.length && timingSafeEqual(actual, expected)
}
