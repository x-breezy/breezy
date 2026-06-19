import { SidebarTrending } from "./sidebar-trending"
import { SidebarSuggestedUsers } from "./sidebar-suggested-users"
import type { SearchProfile } from "@/lib/actions/profiles"

interface RightSidebarProps {
  suggestedUsers: SearchProfile[]
}

export function RightSidebar({ suggestedUsers }: RightSidebarProps) {
  return (
    <div className='flex flex-col gap-4 p-4'>
      <SidebarTrending />
      {suggestedUsers.length > 0 && <SidebarSuggestedUsers users={suggestedUsers} />}
    </div>
  )
}
