import { Suspense } from "react"
import type { Metadata } from "next"
import { SearchHeader } from "@/components/search/search-header"

export const metadata: Metadata = {
  title: "Search",
  description: "Search for people, posts, and topics on Breezy.",
}
import { SearchTabs } from "@/components/search/search-tabs"
import { TagList } from "@/components/search/tag-list"
import { SearchResults } from "@/components/search/search-results"

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams
  const query = q?.trim() ?? ""

  return (
    <>
      <Suspense>
        <SearchHeader />
      </Suspense>
      <Suspense>
        <SearchTabs />
      </Suspense>
      {query ? (
        <Suspense>
          <SearchResults q={query} />
        </Suspense>
      ) : (
        <TagList />
      )}
    </>
  )
}
