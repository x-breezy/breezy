"use server"

import { cookies } from "next/headers"

const API_URL = process.env.API_URL ?? "http://localhost"

export async function uploadMediaAction(
  file: File
): Promise<{ id: string; type: "image" | "video" }> {
  const cookieStore = await cookies()
  const token = cookieStore.get("breezy-token")?.value

  const isVideo = file.type.startsWith("video/")
  const endpoint = isVideo ? "/api/media/videos" : "/api/media/images"

  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": file.type,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: file,
  })

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status}`)
  }

  const data = await res.json()
  const id = data.data?.id
  if (!id) {
    throw new Error("Upload failed: no id returned from server")
  }
  return { id: String(id), type: isVideo ? "video" : "image" }
}
