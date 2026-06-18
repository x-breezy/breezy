"use client"

import { PostComposeDialog } from "@/components/post/create-post/post-compose-dialog"
import { useRouter } from "next/navigation"

export default function PostModal() {
  const router = useRouter()
  return <PostComposeDialog onDismiss={() => router.back()} />
}
