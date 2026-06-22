import { getRedis } from "./redis"

const BANNED_KEY = "banned:users"

export async function getBannedUserIds(): Promise<Set<string>> {
  const ids = await getRedis().smembers(BANNED_KEY)
  return new Set(ids)
}

export async function addBannedUser(userId: string): Promise<void> {
  await getRedis().sadd(BANNED_KEY, userId)
}

export async function removeBannedUser(userId: string): Promise<void> {
  await getRedis().srem(BANNED_KEY, userId)
}
