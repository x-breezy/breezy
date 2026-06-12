import { Suspense } from "react"
import { SearchHeader } from "@/components/search/search-header"
import { SearchTabs } from "@/components/search/search-tabs"
import { TagList } from "@/components/search/TagList"
import { SearchResults } from "@/components/search/search-results"

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams
  const query = q?.trim() ?? ""

  return (
    <div>
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
    </div>
  )
}
