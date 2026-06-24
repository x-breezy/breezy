"use client"

import { useState, useEffect, useCallback } from "react"
import { IconLoader2 } from "@tabler/icons-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

const GIPHY_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY ?? ""

interface GiphyResult {
  id: string
  title: string
  images: {
    fixed_height_small: { url: string }
    original: { url: string }
  }
}

async function fetchGifs(query: string): Promise<{ results: GiphyResult[]; error?: string }> {
  const base = query
    ? `https://api.giphy.com/v1/gifs/search?q=${encodeURIComponent(query)}&`
    : `https://api.giphy.com/v1/gifs/trending?`
  const res = await fetch(`${base}api_key=${GIPHY_KEY}&limit=30&rating=g`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { results: [], error: body?.message ?? `HTTP ${res.status}` }
  }
  const data = await res.json()
  return { results: data.data ?? [] }
}

interface GifPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (file: File) => void
}

export function GifPicker({ open, onClose, onSelect }: GifPickerProps) {
  const [query, setQuery] = useState("")
  const [gifs, setGifs] = useState<GiphyResult[]>([])
  const [loading, setLoading] = useState(false)
  const [picking, setPicking] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)
    const timer = setTimeout(
      async () => {
        const { results, error: err } = await fetchGifs(query)
        setGifs(results)
        setError(err ?? null)
        setLoading(false)
      },
      query ? 400 : 0
    )
    return () => clearTimeout(timer)
  }, [query, open])

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("")
      setGifs([])
      setError(null)
    }
  }, [open])

  const handleSelect = useCallback(
    async (gif: GiphyResult) => {
      setPicking(gif.id)
      try {
        const res = await fetch(gif.images.original.url)
        const blob = await res.blob()
        const file = new File([blob], `${gif.id}.gif`, { type: "image/gif" })
        onSelect(file)
        onClose()
      } finally {
        setPicking(null)
      }
    },
    [onSelect, onClose]
  )

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className='flex max-h-[80vh] flex-col gap-3 overflow-hidden p-4 sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>GIF</DialogTitle>
        </DialogHeader>

        <Input
          placeholder='Search GIFs...'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        <div className='min-h-0 flex-1 overflow-y-auto'>
          {loading ? (
            <div className='flex h-40 items-center justify-center'>
              <IconLoader2 size={20} className='animate-spin text-muted-foreground' />
            </div>
          ) : error ? (
            <p className='py-8 text-center text-sm text-destructive'>{error}</p>
          ) : gifs.length === 0 ? (
            <p className='py-8 text-center text-sm text-muted-foreground'>No results</p>
          ) : (
            <div className='columns-3 gap-1'>
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  className='relative mb-1 w-full cursor-pointer overflow-hidden rounded'
                  onClick={() => handleSelect(gif)}
                  disabled={picking !== null}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={gif.images.fixed_height_small.url}
                    alt={gif.title}
                    className='w-full object-cover'
                    loading='lazy'
                  />
                  {picking === gif.id && (
                    <div className='absolute inset-0 flex items-center justify-center bg-black/40'>
                      <IconLoader2 size={16} className='animate-spin text-white' />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
