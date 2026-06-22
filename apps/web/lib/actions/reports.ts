"use server"

import { authenticatedFetch } from "@/lib/auth/authenticated-fetch"

export async function reportProfile(reportedUserId: string, reason: string): Promise<void> {
  const res = await authenticatedFetch("/api/reports/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reportedUserId, reason }),
  })

  if (!res.ok) throw new Error(`Failed to submit report: ${res.status}`)
}
