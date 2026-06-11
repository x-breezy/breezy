import type { SearchPostMedia } from "@/lib/api/search"

interface MediaGridProps {
  items: SearchPostMedia[]
}

export function MediaGrid({ items }: MediaGridProps) {
  return (
    <li className='p-2'>
      <div className='grid grid-cols-3 gap-1'>
        {items.map((item) =>
          item.type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={item.id}
              src={`/api/media/images/${item.id}`}
              alt=''
              className='aspect-square w-full cursor-pointer rounded object-cover'
              onClick={() => window.open(`/api/media/images/${item.id}`, "_blank")}
            />
          ) : (
            <video
              key={item.id}
              src={`/api/media/videos/${item.id}`}
              className='aspect-square w-full cursor-pointer rounded object-cover'
              controls
            />
          )
        )}
      </div>
    </li>
  )
}
