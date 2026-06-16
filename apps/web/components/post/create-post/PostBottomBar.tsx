"use client"

import { useRef } from "react"
import { IconPhoto, IconVideo } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"

export function PostBottomBar({ onAddMedia }: { onAddMedia: (files: FileList) => void }) {
  const imageRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)
  const t = useTranslations("composePost")

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      onAddMedia(e.target.files)
      e.target.value = ""
    }
  }

  return (
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
  )
}
