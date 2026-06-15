"use server"

import { cookies } from "next/headers"

const GATEWAY_URL = process.env.GATEWAY_URL ?? "http://localhost:80"

export async function uploadMediaAction(
  file: File
): Promise<{ id: string; type: "image" | "video" }> {
  const cookieStore = await cookies()
  const token = cookieStore.get("breezy-token")?.value

  const isVideo = file.type.startsWith("video/")
  const endpoint = isVideo ? "/api/media/videos" : "/api/media/images"

  const res = await fetch(`${GATEWAY_URL}${endpoint}`, {
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
  // Le backend retourne un document MongoDB brut, l'ID est dans _doc._id
  const raw = data.data?._doc || data.data
  const id = raw?._id || raw?.id || raw?.imageId || raw?.mediaId
  console.log("[uploadMediaAction] Extracted id:", id)
  if (!id) {
    throw new Error("Upload failed: no id returned from server")
  }
  const result: { id: string; type: "image" | "video" } = { id: String(id), type: isVideo ? "video" : "image" }
  console.log("[uploadMediaAction] Returning:", result)
  return result
}
