const PROFILE_SERVICE_URL = process.env.PROFILE_SERVICE_URL ?? "http://localhost:4010"

export async function checkProfileExists(userId: string): Promise<boolean> {
  try {
    const res = await fetch(`${PROFILE_SERVICE_URL}/profiles/internal/${userId}`, { method: "GET" })
    return res.status === 200
  } catch {
    return false
  }
}
