"use client"

import { useRef, useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { searchProfiles } from "@/lib/actions/profiles"
import { buildEditorHTML } from "@/lib/post-utils"
import { mediaUrl } from "@/lib/utils"
import type { SearchPostMedia } from "@/lib/actions/posts"
import { PostBottomBar } from "./post-bottom-bar"
import { ProfileAvatar } from "@/components/profile"
import { ProfileBadges } from "@/components/profile/profile-badge"
import { UserRole } from "@/lib/auth/role"
import { useUserStore } from "@/stores/user-store"
import { useTranslations } from "next-intl"
import type { ResolvedMention, MediaPreview } from "./use-post-compose"

interface MentionSuggestion {
  profileId: string
  username: string
  displayName: string
  avatarUrl: string | null
  role: string
}

function getCaretOffset(el: HTMLElement): number {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return 0
  const range = sel.getRangeAt(0).cloneRange()
  range.selectNodeContents(el)
  range.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset)
  return range.toString().length
}

function setCaretAt(el: HTMLElement, offset: number) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let remaining = offset
  while (walker.nextNode()) {
    const node = walker.currentNode as Text
    if (remaining <= node.length) {
      const range = document.createRange()
      range.setStart(node, remaining)
      range.collapse(true)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
      return
    }
    remaining -= node.length
  }
}

export const MAX_POST_CHARS = 250

export function PostForm({
  content,
  setContent,
  mediaFiles,
  onRemoveMedia,
  onAddMedia,
  onSelectGif,
  onMentionResolved,
  existingMedia,
  onRemoveExistingMedia,
  hideBottomBar,
  noMaxHeight,
}: {
  content: string
  setContent: (value: string) => void
  mediaFiles: MediaPreview[]
  onRemoveMedia: (index: number) => void
  onAddMedia: (files: FileList) => void
  onSelectGif: (file: File) => void
  onMentionResolved: (mention: ResolvedMention) => void
  existingMedia?: SearchPostMedia[]
  onRemoveExistingMedia?: (index: number) => void
  hideBottomBar?: boolean
  noMaxHeight?: boolean
}) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isComposing = useRef(false)
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([])
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [popupPos, setPopupPos] = useState<{ top: number; left: number } | null>(null)
  const profile = useUserStore((s) => s.profile)
  const t = useTranslations("composePost")

  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    const html = buildEditorHTML(content)
    if (el.innerHTML !== html) {
      const offset = getCaretOffset(el)
      el.innerHTML = html
      setCaretAt(el, offset)
    }
  }, [content])

  useEffect(() => {
    if (!mentionQuery) {
      setSuggestions([])
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await searchProfiles(mentionQuery, 1, 5)
        if (controller.signal.aborted) return
        setSuggestions(
          res.profiles.map((p) => ({
            profileId: p.profileId,
            username: p.username ?? "",
            displayName: [p.firstName, p.lastName].filter(Boolean).join(" ") || (p.username ?? ""),
            avatarUrl: p.avatarUrl ?? null,
            role: p.role ?? "",
          }))
        )
        setSelectedIndex(0)
      } catch {
        if (!controller.signal.aborted) setSuggestions([])
      }
    }, 200)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [mentionQuery])

  function detectMentionQuery(text: string, cursorPos: number): string | null {
    const match = text.slice(0, cursorPos).match(/@([a-zA-Z0-9_]*)$/)
    return match ? match[1]! : null
  }

  function updatePopupPos() {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || !editorRef.current) {
      setPopupPos(null)
      return
    }
    const caretRect = sel.getRangeAt(0).getBoundingClientRect()
    const dialog = editorRef.current.closest('[role="dialog"]')
    const dialogRect = dialog?.getBoundingClientRect()
    const POPUP_WIDTH = 256,
      POPUP_HEIGHT = 200
    let top = caretRect.bottom + 4
    let left = Math.max(0, caretRect.left)
    if (dialogRect) {
      if (top + POPUP_HEIGHT > dialogRect.bottom) top = caretRect.top - POPUP_HEIGHT - 4
      top = Math.max(dialogRect.top + 4, Math.min(top, dialogRect.bottom - POPUP_HEIGHT))
      left = Math.max(dialogRect.left, Math.min(left, dialogRect.right - POPUP_WIDTH))
    }
    setPopupPos({ top, left })
  }

  function handleInput() {
    if (isComposing.current) return
    const el = editorRef.current
    if (!el) return
    const text = el.innerText.replace(/\n$/, "")
    const offset = getCaretOffset(el)
    setContent(text)
    const q = detectMentionQuery(text, offset)
    setMentionQuery(q)
    if (q !== null) updatePopupPos()
    else setPopupPos(null)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1))
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        if (suggestions[selectedIndex]) applySuggestion(suggestions[selectedIndex])
        return
      }
      if (e.key === "Escape") {
        setSuggestions([])
        setMentionQuery(null)
      }
    }
  }

  function applySuggestion(s: MentionSuggestion) {
    const el = editorRef.current
    if (!el) return
    const offset = getCaretOffset(el)
    const text = el.innerText.replace(/\n$/, "")
    const before = text.slice(0, offset).replace(/@([a-zA-Z0-9_]*)$/, `@${s.username} `)
    const after = text.slice(offset)
    setContent(before + after)
    setSuggestions([])
    setMentionQuery(null)
    setPopupPos(null)
    onMentionResolved({ username: s.username, profileId: s.profileId })
    requestAnimationFrame(() => {
      if (editorRef.current) setCaretAt(editorRef.current, before.length)
    })
  }

  return (
    <>
      <div
        className={`flex flex-col gap-3 px-4 ${noMaxHeight ? "min-h-0 flex-1 py-4" : "max-h-[60vh] overflow-y-auto pt-6 pb-4"}`}
      >
        <div className={`flex gap-3 ${noMaxHeight ? "min-h-0 flex-1" : "h-full"}`}>
          <ProfileAvatar size='2xs' src={profile?.avatarId ?? ""} />

          <div className='relative flex-1'>
            {!content && (
              <span className='pointer-events-none absolute top-0 left-0 text-xl text-muted-foreground/80 select-none'>
                {t("placeholder")}
              </span>
            )}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => {
                isComposing.current = true
              }}
              onCompositionEnd={() => {
                isComposing.current = false
                handleInput()
              }}
              className='min-h-[6rem] w-full max-w-full text-xl leading-7 whitespace-pre-wrap outline-none'
              autoFocus
            />

            {suggestions.length > 0 &&
              popupPos &&
              createPortal(
                <ul
                  className='fixed z-[130] w-64 overflow-hidden rounded-xl border bg-popover shadow-lg'
                  style={{ top: popupPos.top, left: popupPos.left }}
                >
                  {suggestions.map((s, i) => (
                    <li
                      key={s.profileId}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        applySuggestion(s)
                      }}
                      className={`flex cursor-pointer items-center gap-3 px-4 py-3 ${i === selectedIndex ? "bg-accent" : "hover:bg-accent/50"}`}
                    >
                      <ProfileAvatar
                        size='2xs'
                        src={s.avatarUrl ?? ""}
                        className='size-10 shrink-0'
                      />
                      <div className='flex min-w-0 flex-col'>
                        <span className='flex items-center gap-1 truncate font-semibold'>
                          {s.displayName}
                          <ProfileBadges role={s.role as UserRole} />
                        </span>
                        <span className='truncate text-sm text-muted-foreground'>
                          @{s.username}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>,
                document.body
              )}
          </div>
        </div>

        {((existingMedia?.length ?? 0) > 0 || mediaFiles.length > 0) && (
          <div className='grid grid-cols-2 gap-2 pl-12'>
            {existingMedia?.map((m, i) => (
              <div key={m.id} className='relative overflow-hidden rounded-lg'>
                {m.type === "image" ? (
                  <img
                    src={mediaUrl(`/api/media/images/${m.id}`)}
                    alt=''
                    className='h-32 w-full object-cover'
                  />
                ) : (
                  <video
                    src={mediaUrl(`/api/media/videos/${m.id}`)}
                    className='h-32 w-full object-cover'
                    muted
                  />
                )}
                <button
                  type='button'
                  onClick={() => onRemoveExistingMedia?.(i)}
                  className='absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-xs text-white'
                >
                  ×
                </button>
              </div>
            ))}
            {mediaFiles.map((m, i) => (
              <div key={i} className='relative overflow-hidden rounded-lg'>
                {m.type === "image" ? (
                  <img src={m.previewUrl} alt='' className='h-32 w-full object-cover' />
                ) : (
                  <video src={m.previewUrl} className='h-32 w-full object-cover' muted />
                )}
                <button
                  type='button'
                  onClick={() => onRemoveMedia(i)}
                  className='absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-xs text-white'
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {!hideBottomBar && (
        <div className='shrink-0'>
          <PostBottomBar
            onAddMedia={onAddMedia}
            onSelectGif={onSelectGif}
            charCount={content.length}
          />
        </div>
      )}
    </>
  )
}
