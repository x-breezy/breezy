"use client"

import { useState, useCallback, useEffect } from "react"
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

export function usePostCompose(parentId?: string, initialContent = "") {
  const [content, setContent] = useState(initialContent)
  const [mediaFiles, setMediaFiles] = useState<MediaPreview[]>([])
  const [resolvedMentions, setResolvedMentions] = useState<ResolvedMention[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addMedia = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files)
    const previews: MediaPreview[] = arr.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "video" : "image",
    }))
    setMediaFiles((prev) => [...prev, ...previews])
  }, [])

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
      mediaFiles.forEach((m) => URL.revokeObjectURL(m.previewUrl))
      setContent("")
      setMediaFiles([])
      setResolvedMentions([])
      return true
    } catch {
      // Cleanup uploaded media on error, but keep previews for retry
      uploadedMedia.forEach((m) => {
        // TODO: Call delete media API if needed
      })
      setError("Failed to post. Please try again.")
      return false
    } finally {
      setSubmitting(false)
    }
  }, [content, mediaFiles, resolvedMentions])

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      mediaFiles.forEach((m) => URL.revokeObjectURL(m.previewUrl))
    }
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
