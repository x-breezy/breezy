"use client"

import { useState, useCallback, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { createPost } from "@/lib/actions/posts"
import { uploadMediaAction } from "@/lib/actions/media"
import type { SearchPostMedia } from "@/lib/actions/posts"

export interface MentionSuggestion {
  profileId: string
  username: string
  displayName: string
}

export interface ResolvedMention {
  username: string
  profileId: string
}

export interface MediaPreview {
  file: File
  previewUrl: string
  type: "image" | "video"
}

function parseTags(content: string): string[] {
  const matches = content.match(/#([a-zA-Z0-9_À-ÿ]+)/g) ?? []
  return [...new Set(matches.map((t) => t.slice(1)))]
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB ,  matches next.config.ts serverActions.bodySizeLimit

export function usePostCompose(parentId?: string, initialContent = "") {
  const queryClient = useQueryClient()
  const t = useTranslations("composePost")
  const [content, setContent] = useState(initialContent)
  const [mediaFiles, setMediaFiles] = useState<MediaPreview[]>([])
  const [resolvedMentions, setResolvedMentions] = useState<ResolvedMention[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addMedia = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files)
      const oversized = arr.find((f) => f.size > MAX_FILE_SIZE)
      if (oversized) {
        const type = oversized.type.startsWith("video/") ? "Video" : "File"
        setError(t("tooLarge", { type, size: 10 }))
        return
      }
      setError(null)
      const previews: MediaPreview[] = arr.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        type: file.type.startsWith("video/") ? "video" : "image",
      }))
      setMediaFiles((prev) => [...prev, ...previews])
    },
    [t]
  )

  const removeMedia = useCallback((index: number) => {
    setMediaFiles((prev) => {
      const next = [...prev]
      URL.revokeObjectURL(next[index]!.previewUrl)
      next.splice(index, 1)
      return next
    })
  }, [])

  const resolveMention = useCallback((mention: ResolvedMention) => {
    setResolvedMentions((prev) => {
      if (prev.some((m) => m.profileId === mention.profileId)) return prev
      return [...prev, mention]
    })
  }, [])

  const submit = useCallback(async (): Promise<boolean> => {
    if (!content.trim()) return false
    setSubmitting(true)
    setError(null)
    let uploadedMedia: SearchPostMedia[] = []
    try {
      if (mediaFiles.length > 0) {
        uploadedMedia = await Promise.all(mediaFiles.map((m) => uploadMediaAction(m.file)))
      }

      const usedUsernames = new Set(
        (content.match(/@([a-zA-Z0-9_]+)/g) ?? []).map((m) => m.slice(1).toLowerCase())
      )
      const mentionIds = resolvedMentions
        .filter((m) => usedUsernames.has(m.username.toLowerCase()))
        .map((m) => m.profileId)

      await createPost({
        content,
        tags: parseTags(content),
        mentions: mentionIds,
        media: uploadedMedia,
        ...(parentId ? { parentId } : {}),
      })

      // Cleanup object URLs after successful upload
      mediaFiles.forEach((_m) => URL.revokeObjectURL(_m.previewUrl))
      setContent("")
      setMediaFiles([])
      setResolvedMentions([])
      queryClient.invalidateQueries({ queryKey: ["feed"] })
      if (parentId) {
        queryClient.invalidateQueries({ queryKey: ["profile-posts"] })
      }
      return true
    } catch (e) {
      // Cleanup uploaded media on error, but keep previews for retry
      uploadedMedia.forEach(() => {
        // TODO: Call delete media API if needed
      })
      if (e instanceof Error && (e.message === "FILE_TOO_LARGE" || e.message.includes("413"))) {
        setError(t("tooLarge", { type: "File", size: 10 }))
      } else {
        setError(t("failedToPost"))
      }
      return false
    } finally {
      setSubmitting(false)
    }
  }, [content, mediaFiles, resolvedMentions, parentId, queryClient, t])

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      mediaFiles.forEach((m) => URL.revokeObjectURL(m.previewUrl))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    content,
    setContent,
    mediaFiles,
    addMedia,
    removeMedia,
    resolvedMentions,
    resolveMention,
    submitting,
    error,
    submit,
  }
}
