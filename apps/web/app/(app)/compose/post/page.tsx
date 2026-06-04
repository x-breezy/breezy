"use client"

import { useRouter } from "next/navigation"
import { PostComposeDialog } from "@/components/post/PostComposeDialog"

export default function PostPage() {
  const router = useRouter()
  return <PostComposeDialog onDismiss={() => router.push("/")} />
}
