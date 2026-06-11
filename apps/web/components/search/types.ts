export type Tab = "posts" | "people" | "media"

export const VALID_TABS: Tab[] = ["posts", "people", "media"]

export function parseTab(value: string | null): Tab {
    return VALID_TABS.includes(value as Tab) ? (value as Tab) : "posts"
}
