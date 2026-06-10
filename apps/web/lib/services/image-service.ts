import serverClient from "@/lib/api/server-client"

export function getImageStream(imageId: string, authHeader: Record<string, string>) {
  return serverClient.get(`/api/media/images/${imageId}`, { headers: authHeader })
}

export async function uploadImage(image: File, authHeader: Record<string, string>) {
  const buffer = Buffer.from(await image.arrayBuffer())
  return serverClient.post("/api/media/images", buffer, {
    headers: {
      ...authHeader,
      "Content-Type": image.type,
      "X-Filename": image.name,
    },
  })
}
