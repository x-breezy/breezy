"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { IconHistory, IconSearch, IconX } from "@tabler/icons-react"
import { useDebounce } from "@/hooks/use-debounce"
import { useRecentSearches } from "@/hooks/use-recent-searches"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { PageHeader } from "@/components/layout/page-header"
import { cn } from "@/lib/utils"

export function SearchHeader() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations("search")
  const [value, setValue] = useState(searchParams.get("q") ?? "")
  const [focused, setFocused] = useState(false)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const urlQ = searchParams.get("q") ?? ""
  const { recentSearches, isLoaded, addSearch, removeSearch, clearSearches } = useRecentSearches()

  const lastPushed = useRef("")
  const debouncedValue = useDebounce(value, 300)
  const displayValue = focused ? value : urlQ
  const hasRecentSearches = isLoaded && recentSearches.length > 0

  // Fermer le popover quand on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const q = debouncedValue.trim()
    if (focused && q !== lastPushed.current) {
      lastPushed.current = q
      const params = new URLSearchParams(searchParams.toString())
      if (q) {
        params.set("q", q)
      } else {
        params.delete("q")
      }
      router.push(`/search?${params.toString()}`)
    }
  }, [debouncedValue, focused, router, searchParams])

  function submit() {
    const q = value.trim()
    if (!q) return
    addSearch(q)
    const params = new URLSearchParams(searchParams.toString())
    params.set("q", q)
    router.push(`/search?${params.toString()}`)
    inputRef.current?.blur()
    setFocused(false)
    setOpen(false)
  }

  function selectRecentSearch(query: string) {
    setValue(query)
    addSearch(query)
    const params = new URLSearchParams(searchParams.toString())
    params.set("q", query)
    router.push(`/search?${params.toString()}`)
    inputRef.current?.blur()
    setFocused(false)
    setOpen(false)
  }

  return (
    <PageHeader className='bg-background py-2'>
      <div ref={containerRef} className='relative flex items-center'>
        <InputGroup className='h-11 rounded-full px-2 text-base'>
          <InputGroupAddon align='inline-start'>
            <InputGroupText>
              <IconSearch size={20} strokeWidth={2} />
            </InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            ref={inputRef}
            type='text'
            placeholder={t("placeholder")}
            aria-label={t("placeholder")}
            className='text-base'
            value={displayValue}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => {
              setValue(urlQ)
              setFocused(true)
              setOpen(true)
            }}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          {displayValue && (
            <InputGroupAddon align='inline-end'>
              <InputGroupButton
                size='icon-sm'
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setValue("")
                  const params = new URLSearchParams(searchParams.toString())
                  params.delete("q")
                  router.push(`/search?${params.toString()}`)
                }}
                aria-label={t("cancel")}
              >
                <IconX size={16} />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>

        {/* Popover des recherches récentes */}
        {open && hasRecentSearches && (
          <div className='absolute top-full right-0 left-0 z-50 mt-2'>
            <div className='rounded-2xl bg-popover p-2 text-popover-foreground shadow-lg ring-1 ring-foreground/5 dark:ring-foreground/10'>
              <div className='flex items-center justify-between px-2 py-1.5'>
                <span className='text-xs font-medium text-muted-foreground'>
                  {t("recentSearches")}
                </span>
                <button
                  onClick={clearSearches}
                  className='text-xs text-muted-foreground transition-colors hover:text-foreground'
                >
                  {t("clearAll")}
                </button>
              </div>
              <div className='mt-1 space-y-0.5'>
                {recentSearches.map((query, index) => (
                  <div
                    key={`${query}-${index}`}
                    className={cn(
                      "group flex cursor-pointer items-center justify-between gap-2 rounded-xl px-2 py-2 hover:bg-accent"
                    )}
                    onClick={() => selectRecentSearch(query)}
                  >
                    <div className='flex items-center gap-2 overflow-hidden'>
                      <IconHistory size={16} className='shrink-0 text-muted-foreground' />
                      <span className='truncate text-sm'>{query}</span>
                    </div>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.stopPropagation()
                        removeSearch(query)
                      }}
                      className='shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-background hover:text-foreground'
                      aria-label={t("removeSearch")}
                    >
                      <IconX size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageHeader>
  )
}
