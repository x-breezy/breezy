"use server"

import { authenticatedFetch } from "@/lib/auth/authenticated-fetch"

export async function uploadMediaAction(
  file: File
): Promise<{ id: string; type: "image" | "video" }> {
  const isVideo = file.type.startsWith("video/")
  const endpoint = isVideo ? "/api/media/videos" : "/api/media/images"

  const res = await authenticatedFetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": file.type },
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
