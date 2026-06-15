"use client"

import { useState } from "react"
import type { SearchPostMedia } from "@/lib/actions/posts"
import { MediaViewer } from "@/components/shared/media-viewer"
import { AutoplayVideo } from "@/components/shared/autoplay-video"
import { MediaImage } from "@/components/shared/media-image"
import { mediaUrl } from "@/lib/utils"

interface MediaGridProps {
  items: SearchPostMedia[]
}

export function MediaGrid({ items }: MediaGridProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  return (
    <>
      <li className='p-2'>
        <div className='grid grid-cols-3 gap-1'>
          {items.map((item, i) =>
            item.type === "image" ? (
              <MediaImage
                key={item.id}
                src={mediaUrl(`/api/media/images/${item.id}`)}
                onClick={() => setViewerIndex(i)}
                cover
              />
            ) : (
              <AutoplayVideo
                key={item.id}
                src={mediaUrl(`/api/media/videos/${item.id}`)}
                className='aspect-square w-full cursor-pointer rounded-lg object-cover'
                onClick={() => setViewerIndex(i)}
              />
            )
          )}
        </div>
      </li>
      <MediaViewer
        items={items}
        open={viewerIndex !== null}
        index={viewerIndex ?? 0}
        onClose={() => setViewerIndex(null)}
        onNavigate={setViewerIndex}
      />
    </>
  )
}
