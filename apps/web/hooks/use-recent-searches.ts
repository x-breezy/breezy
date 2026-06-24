"use client"

import { useCallback, useState } from "react"

const STORAGE_KEY = "breezy_recent_searches"
const MAX_RECENT_SEARCHES = 5

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) return parsed
      }
    } catch {
      // Ignore localStorage errors
    }
    return []
  })

  const saveSearches = useCallback((searches: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(searches))
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  const addSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim()
      if (!trimmed) return

      setRecentSearches((prev) => {
        const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())
        const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES)
        saveSearches(updated)
        return updated
      })
    },
    [saveSearches]
  )

  const removeSearch = useCallback(
    (query: string) => {
      setRecentSearches((prev) => {
        const updated = prev.filter((s) => s !== query)
        saveSearches(updated)
        return updated
      })
    },
    [saveSearches]
  )

  const clearSearches = useCallback(() => {
    setRecentSearches([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  return {
    recentSearches,
    isLoaded: true,
    addSearch,
    removeSearch,
    clearSearches,
  }
}
