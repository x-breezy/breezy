"use client"

import { cn } from "@/lib/utils"
import { useRef, useState, useEffect, useCallback } from "react"
import { Slider as SliderPrimitive } from "@base-ui/react/slider"
import {
  IconPlayerPlayFilled,
  IconPlayerPauseFilled,
  IconVolume,
  IconVolumeOff,
  IconSettings,
  IconMaximize,
} from "@tabler/icons-react"

const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00"
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

export interface PlaybackState {
  currentTime: number
  duration: number
}

interface AutoplayVideoProps {
  src: string
  className?: string
  onMaximize?: () => void
  onPlaybackUpdate?: (state: PlaybackState) => void
}

export function AutoplayVideo({
  src,
  className,
  onMaximize,
  onPlaybackUpdate,
}: AutoplayVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const showUntilPauseRef = useRef(false)
  const onPlaybackUpdateRef = useRef(onPlaybackUpdate)
  onPlaybackUpdateRef.current = onPlaybackUpdate
  const lastTimeRef = useRef(-1)
  const rafRef = useRef(0)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isDragging, setIsDragging] = useState(false)

  const cancelHide = useCallback(() => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
  }, [])

  const scheduleHide = useCallback(() => {
    cancelHide()
    hideTimeoutRef.current = setTimeout(() => {
      if (!showUntilPauseRef.current) setShowControls(false)
    }, 3000)
  }, [cancelHide])

  const showWithTimeout = useCallback(() => {
    setShowControls(true)
    if (isPlaying) scheduleHide()
    else showUntilPauseRef.current = true
  }, [isPlaying, scheduleHide])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) el.play().catch(() => {})
        else el.pause()
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return

    const onPlay = () => {
      setIsPlaying(true)
      showUntilPauseRef.current = false
    }
    const onPause = () => {
      setIsPlaying(false)
      setShowControls(true)
      cancelHide()
    }
    const onTimeUpdate = () => {
      setCurrentTime(el.currentTime)
    }
    const onLoadedMetadata = () => {
      const d = el.duration
      setDuration(d)
      onPlaybackUpdateRef.current?.({ currentTime: el.currentTime, duration: d })
    }

    el.addEventListener("play", onPlay)
    el.addEventListener("pause", onPause)
    el.addEventListener("timeupdate", onTimeUpdate)
    el.addEventListener("loadedmetadata", onLoadedMetadata)

    return () => {
      el.removeEventListener("play", onPlay)
      el.removeEventListener("pause", onPause)
      el.removeEventListener("timeupdate", onTimeUpdate)
      el.removeEventListener("loadedmetadata", onLoadedMetadata)
    }
  }, [cancelHide])

  useEffect(() => {
    if (!showSettings) return
    const handleClick = () => setShowSettings(false)
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [showSettings])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const tick = () => {
      rafRef.current = requestAnimationFrame(tick)
      if (el.paused) return
      const ct = el.currentTime
      if (ct === lastTimeRef.current) return
      lastTimeRef.current = ct
      setCurrentTime(ct)
      onPlaybackUpdateRef.current?.({ currentTime: ct, duration: el.duration })
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const togglePlay = useCallback(() => {
    const el = videoRef.current
    if (!el) return
    if (el.paused) el.play()
    else el.pause()
  }, [])

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const el = videoRef.current
    if (!el) return
    el.muted = !el.muted
    setIsMuted(el.muted)
  }, [])

  const handleSettingsClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowSettings((prev) => !prev)
  }, [])

  const handleSpeedChange = useCallback((rate: number) => {
    const el = videoRef.current
    if (!el) return
    el.playbackRate = rate
    setPlaybackRate(rate)
    setShowSettings(false)
  }, [])

  const handleMaximize = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onMaximize?.()
    },
    [onMaximize]
  )

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden rounded-xl select-none", className)}
      onMouseEnter={showWithTimeout}
      onMouseMove={showWithTimeout}
      onMouseLeave={() => {
        cancelHide()
        if (isPlaying) setShowControls(false)
        setShowSettings(false)
      }}
    >
      <video
        ref={videoRef}
        src={src}
        muted
        loop
        playsInline
        preload='metadata'
        className='block w-full rounded-xl border'
        onClick={togglePlay}
      />

      {duration > 0 && !showControls && (
        <div className='pointer-events-none absolute bottom-2 left-2 rounded-xl bg-black/80 px-1.5 py-0.5 text-xs text-white tabular-nums'>
          {formatTime(Math.max(0, duration - currentTime))}
        </div>
      )}

      {!isPlaying && (
        <div className='pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-black/20'>
          <div className='flex size-12 items-center justify-center rounded-full bg-black/60'>
            <IconPlayerPlayFilled className='ml-0.5 size-6 text-white' />
          </div>
        </div>
      )}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 transition-opacity duration-200",
          showControls ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div className='rounded-b-lg bg-gradient-to-t from-black/80 to-transparent px-2 pt-8 pb-1.5'>
          <SliderPrimitive.Root
            min={0}
            max={duration || 1}
            step={0.01}
            value={[currentTime]}
            onValueChange={(v) => {
              const el = videoRef.current
              if (!el) return
              el.currentTime = v
              setCurrentTime(v)
            }}
            className='mb-1.5'
          >
            <SliderPrimitive.Control className='group relative flex w-full touch-none items-center'>
              <SliderPrimitive.Track className='relative h-1 w-full overflow-hidden rounded-full bg-white/30'>
                <SliderPrimitive.Indicator className='h-full rounded-full bg-white' />
              </SliderPrimitive.Track>
              <SliderPrimitive.Thumb className='block size-3 rounded-full bg-white opacity-0 transition-opacity group-hover:opacity-100 data-dragging:opacity-100' />
            </SliderPrimitive.Control>
          </SliderPrimitive.Root>

          <div className='flex items-center gap-2 text-white'>
            <button
              type='button'
              onClick={(e) => {
                e.stopPropagation()
                togglePlay()
              }}
              className='flex size-7 items-center justify-center rounded-full hover:bg-white/20'
            >
              {isPlaying ? (
                <IconPlayerPauseFilled className='size-4' />
              ) : (
                <IconPlayerPlayFilled className='size-4' />
              )}
            </button>

            <span className='min-w-[70px] text-xs tabular-nums'>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className='flex-1' />

            <div className='relative'>
              <button
                type='button'
                onClick={handleSettingsClick}
                className='flex size-7 items-center justify-center rounded-full hover:bg-white/20'
              >
                <IconSettings className='size-4' />
              </button>

              {showSettings && (
                <div className='absolute right-0 bottom-full mb-2 min-w-[130px] rounded-lg bg-neutral-900 py-1 shadow-lg'>
                  <div className='px-3 py-1 text-[11px] font-medium tracking-wider text-white/50 uppercase'>
                    Speed
                  </div>
                  {PLAYBACK_RATES.map((rate) => (
                    <button
                      key={rate}
                      type='button'
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-1 text-left text-sm hover:bg-white/10",
                        rate === playbackRate && "text-blue-400"
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSpeedChange(rate)
                      }}
                    >
                      <span className='inline-flex w-4 items-center justify-center'>
                        {rate === playbackRate && (
                          <svg
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth={2}
                            className='size-3.5'
                          >
                            <polyline points='20 6 9 17 4 12' />
                          </svg>
                        )}
                      </span>
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type='button'
              onClick={toggleMute}
              className='flex size-7 items-center justify-center rounded-full hover:bg-white/20'
            >
              {isMuted ? <IconVolumeOff className='size-4' /> : <IconVolume className='size-4' />}
            </button>

            {onMaximize && (
              <button
                type='button'
                onClick={handleMaximize}
                className='flex size-7 items-center justify-center rounded-full hover:bg-white/20'
              >
                <IconMaximize className='size-4' />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
