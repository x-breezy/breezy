"use server"

import { cookies } from "next/headers"

const API_URL = process.env.API_URL ?? "http://localhost"

export async function reportProfile(reportedUserId: string, reason: string): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get("breezy-token")?.value

  const res = await fetch(`${API_URL}/api/reports/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ reportedUserId, reason }),
  })

  if (!res.ok) throw new Error(`Failed to submit report: ${res.status}`)
}
