import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileSection, ProfilePostsSection, BioMention } from "@/components/profile"

// Mock data - à remplacer par API
const profileData = {
  avatar: "/test/pp_test.png",
  name: "Sam Altman",
  username: "sam_alt",
  role: "admin" as "user" | "moderator" | "admin",
  followers: 1200,
  following: 12,
  bio: `Founder <BioMention username="OpenAI" />, i trust in AI. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966, when de`,
  posts: [
    {
      id: "1",
      author: {
        name: "Grod",
        username: "grod_le_goat",
        avatar: "/test/pp_test.png",
      },
      content:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966, when designers at Letraset and James Mosley, the librarian at St Bride Printing Library, took a 1914 Cicero translation and scrambled it to make dummy text for Letraset's Body Type sheets.",
      timestamp: "2h",
    },
  ],
}

export default function ProfilePage() {
  return (
    <div>
      <ProfileHeader />

      <main className='md:px-4 md:py-6'>
        <ProfileSection
          avatar={profileData.avatar}
          name={profileData.name}
          username={profileData.username}
          role={profileData.role}
          followers={profileData.followers}
          following={profileData.following}
          bio={
            <>
              Founder <BioMention username='OpenAI' />, i trust in AI. Lorem Ipsum is simply dummy
              text of the printing and typesetting industry. Lorem Ipsum has been the
              industry&apos;s standard dummy text ever since 1966, when de
            </>
          }
        />

        <ProfilePostsSection posts={profileData.posts} className='mt-8' />
      </main>
    </div>
  )
}
