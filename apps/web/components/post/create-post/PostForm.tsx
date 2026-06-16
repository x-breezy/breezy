"use client"

import { useRef, useState, useEffect } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { searchProfiles } from "@/lib/actions/profiles"
import { useTranslations } from "next-intl"
import type { ResolvedMention, MediaPreview } from "@/components/post/use-post-compose"
import { buildPostHTML } from "@/lib/post-utils"
import { PostBottomBar } from "./PostBottomBar"
import { MediaPreview, ResolvedMention } from "./use-post-compose"

interface MentionSuggestion {
  profileId: string
  username: string
  displayName: string
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

export function PostForm({
  content,
  setContent,
  mediaFiles,
  onRemoveMedia,
  onAddMedia,
  onMentionResolved,
}: {
  content: string
  setContent: (value: string) => void
  mediaFiles: MediaPreview[]
  onRemoveMedia: (index: number) => void
  onAddMedia: (files: FileList) => void
  onMentionResolved: (mention: ResolvedMention) => void
}) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isComposing = useRef(false)
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([])
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [popupPos, setPopupPos] = useState<{ top: number; left: number } | null>(null)
  const t = useTranslations("composePost")

  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    const html = buildPostHTML(content)
    if (el.innerHTML !== html) {
      const offset = getCaretOffset(el)
      el.innerHTML = html
      setCaretAt(el, offset)
    }
  }, [content])

  useEffect(() => {
    if (mentionQuery === null || mentionQuery.length === 0) {
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
          }))
        )
        setSelectedIndex(0)
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([])
        }
      }
    }, 200)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [mentionQuery])

  function detectMentionQuery(text: string, cursorPos: number): string | null {
    const before = text.slice(0, cursorPos)
    const match = before.match(/@([a-zA-Z0-9_]*)$/)
    return match ? match[1]! : null
  }

  function updatePopupPos() {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || !editorRef.current) {
      setPopupPos(null)
      return
    }
    const range = sel.getRangeAt(0)
    const caretRect = range.getBoundingClientRect()
    const editorRect = editorRef.current.getBoundingClientRect()
    setPopupPos({
      top: caretRect.bottom - editorRect.top + 4,
      left: Math.max(0, caretRect.left - editorRect.left),
    })
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
        if (suggestions[selectedIndex]) {
          applySuggestion(suggestions[selectedIndex])
        }
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
    const next = before + after
    setContent(next)
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
      <div className='flex max-h-[60vh] flex-1 flex-col gap-3 overflow-y-auto px-4 py-4'>
        <div className='flex h-full gap-3'>
          <Avatar size='lg'>
            <AvatarFallback className='bg-amber-700 text-white'>G</AvatarFallback>
          </Avatar>

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
              className='h-full min-h-[6rem] w-full max-w-full text-xl leading-7 outline-none'
              autoFocus
            />
            {suggestions.length > 0 && popupPos && (
              <ul
                className='absolute z-50 w-64 overflow-hidden rounded-xl border bg-popover shadow-lg'
                style={{ top: popupPos.top, left: popupPos.left }}
              >
                {suggestions.map((s, i) => (
                  <li
                    key={s.profileId}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      applySuggestion(s)
                    }}
                    className={`flex cursor-pointer flex-col px-3 py-2 text-sm ${i === selectedIndex ? "bg-accent" : "hover:bg-accent/50"}`}
                  >
                    <span className='font-medium'>@{s.username}</span>
                    {s.displayName !== s.username && (
                      <span className='text-xs text-muted-foreground'>{s.displayName}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {mediaFiles.length > 0 && (
          <div className='grid grid-cols-2 gap-2 pl-12'>
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

      <div className='shrink-0'>
        <PostBottomBar onAddMedia={onAddMedia} />
      </div>
    </>
  )
}
            