"use client"

import { useRouter } from "next/navigation"
import { PostComposeDialog } from "@/components/post/PostComposeDialog"

export default function PostModal() {
  const router = useRouter()
  return <PostComposeDialog onDismiss={() => router.back()} />
}
