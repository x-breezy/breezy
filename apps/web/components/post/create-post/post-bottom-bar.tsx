"use client"

import { useRef, useState } from "react"
import { IconPhoto, IconVideo } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { GifPicker } from "./gif-picker"
import { useTranslations } from "next-intl"

const MAX_CHARS = 250

interface PostBottomBarProps {
  onAddMedia: (files: FileList) => void
  onSelectGif: (file: File) => void
  charCount?: number
}

export function PostBottomBar({ onAddMedia, onSelectGif, charCount = 0 }: PostBottomBarProps) {
  const imageRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)
  const [gifOpen, setGifOpen] = useState(false)
  const t = useTranslations("composePost")

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      onAddMedia(e.target.files)
      e.target.value = ""
    }
  }

  return (
    <>
      <div className='flex items-center gap-1 border-t px-2 py-2'>
        <Button
          variant='ghost'
          size='icon-lg'
          aria-label={t("addPhoto")}
          onClick={() => imageRef.current?.click()}
        >
          <IconPhoto className='size-5 text-muted-foreground' strokeWidth={2} />
        </Button>
        <Button
          variant='ghost'
          size='icon-lg'
          aria-label={t("addVideo")}
          onClick={() => videoRef.current?.click()}
        >
          <IconVideo className='size-5 text-muted-foreground' strokeWidth={2} />
        </Button>
        <Button
          variant='ghost'
          size='icon-lg'
          aria-label={t("addGif")}
          onClick={() => setGifOpen(true)}
        >
          <span className='text-xs font-bold text-muted-foreground'>GIF</span>
        </Button>

        <span
          className={`ml-auto pr-2 text-xs tabular-nums ${charCount >= MAX_CHARS ? "font-semibold text-destructive" : "text-muted-foreground"}`}
        >
          {charCount}/{MAX_CHARS}
        </span>

        <input
          ref={imageRef}
          type='file'
          accept='image/*'
          multiple
          className='hidden'
          onChange={handleChange}
        />
        <input
          ref={videoRef}
          type='file'
          accept='video/*'
          className='hidden'
          onChange={handleChange}
        />
      </div>

      <GifPicker
        open={gifOpen}
        onClose={() => setGifOpen(false)}
        onSelect={(file) => {
          onSelectGif(file)
          setGifOpen(false)
        }}
      />
    </>
  )
}
