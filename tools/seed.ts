#!/usr/bin/env tsx
/**
 * Seed script, populates auth, profile and post services with sample data.
 * Run: npx tsx tools/seed.ts
 * Requires the stack to be running (docker compose up -d).
 */

const BASE_URL = process.env.API_URL ?? "http://localhost"

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function req<T = unknown>(
  method: string,
  path: string,
  options: { token?: string; body?: unknown } = {}
): Promise<{ status: number; data: T }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (options.token) headers.Authorization = `Bearer ${options.token}`

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const text = await res.text()
  let data: T
  try {
    data = JSON.parse(text) as T
  } catch {
    data = text as T
  }
  return { status: res.status, data }
}

interface AuthResponse {
  data?: { token?: string; refreshToken?: string; user?: { id?: string } }
}

interface PostResponse {
  data?: { _id?: string }
}

const USERS = [
  {
    username: "alice_dev",
    email: "alice@breezy.local",
    password: "Seed1234!",
    firstName: "Alice",
    lastName: "Martin",
    bio: "Full-stack dev, coffee addict ☕",
  },
  {
    username: "bob_design",
    email: "bob@breezy.local",
    password: "Seed1234!",
    firstName: "Bob",
    lastName: "Dupont",
    bio: "UI/UX designer & React enthusiast",
  },
  {
    username: "carol_ops",
    email: "carol@breezy.local",
    password: "Seed1234!",
    firstName: "Carol",
    lastName: "Bernard",
    bio: "DevOps, Kubernetes all day",
  },
  {
    username: "dave_mobile",
    email: "dave@breezy.local",
    password: "Seed1234!",
    firstName: "Dave",
    lastName: "Leroy",
    bio: "React Native & Flutter developer",
  },
  {
    username: "emma_data",
    email: "emma@breezy.local",
    password: "Seed1234!",
    firstName: "Emma",
    lastName: "Moreau",
    bio: "Data engineer, Python & Spark",
  },
]

const POSTS_BY_USER: Record<string, { content: string; tags: string[] }[]> = {
  alice_dev: [
    {
      content:
        "Just shipped a new feature using TypeScript generics, the type safety is incredible! 🚀",
      tags: ["TypeScript", "WebDev", "Frontend"],
    },
    {
      content: "Hot take: TailwindCSS + shadcn/ui is the best DX combo for React in 2024.",
      tags: ["TailwindCSS", "React", "Frontend"],
    },
    {
      content:
        "NextJS 15 server actions are a game changer for form handling. No more boilerplate!",
      tags: ["NextJS", "React", "WebDev"],
    },
    {
      content:
        "Migrating from Jest to Vitest was the best decision we made this quarter. Test suite runs 3x faster.",
      tags: ["Testing", "Vitest", "JavaScript"],
    },
    {
      content:
        "Understanding React Server Components (RSC) finally clicked for me today. The mental model shift is real.",
      tags: ["React", "Performance", "Frontend"],
    },
    {
      content:
        "GraphQL vs REST in 2024: REST with OpenAPI types is often more than enough for most projects.",
      tags: ["API", "Backend", "Architecture"],
    },
  ],
  bob_design: [
    {
      content:
        "Design tip: consistent spacing is more important than perfect colors. Start with an 8px grid.",
      tags: ["UXDesign", "Frontend", "Design"],
    },
    {
      content: "Figma variables just made design tokens so much easier to manage across themes.",
      tags: ["UXDesign", "Design", "Figma"],
    },
    {
      content:
        "Accessibility (a11y) is not an afterthought. Stop using <div> for buttons. Semantic HTML matters.",
      tags: ["Accessibility", "Frontend", "Design"],
    },
    {
      content:
        "Framer Motion makes complex animations trivial. Delightful micro-interactions improve retention.",
      tags: ["Animation", "React", "UX"],
    },
    {
      content:
        "Dark mode shouldn't just be pure black. Use deeply saturated grays to reduce eye strain.",
      tags: ["UI", "Design", "DarkTheme"],
    },
  ],
  carol_ops: [
    {
      content: "PSA: use readiness and liveness probes in K8s. Your on-call team will thank you.",
      tags: ["DevOps", "Kubernetes", "OpenSource"],
    },
    {
      content:
        "Just automated our entire CI/CD pipeline with GitHub Actions. Deploy time went from 20min to 4min.",
      tags: ["DevOps", "OpenSource", "CI/CD"],
    },
    {
      content: "Docker multi-stage builds cut our image size by 70%. Always worth the extra step.",
      tags: ["DevOps", "Docker", "WebDev"],
    },
    {
      content:
        "Terraform state management best practices: always use remote state with locking enabled.",
      tags: ["Terraform", "Infrastructure", "Cloud"],
    },
    {
      content: "Prometheus + Grafana = ❤️. Visibility into your cluster is not optional.",
      tags: ["Monitoring", "SRE", "Kubernetes"],
    },
    {
      content: "Stop putting hardcoded secrets in your Dockerfiles. Use external secret managers.",
      tags: ["Security", "DevOps", "BestPractices"],
    },
  ],
  dave_mobile: [
    {
      content:
        "React Native 0.74, the new architecture is finally stable. Migration guide incoming!",
      tags: ["React", "Mobile", "Frontend"],
    },
    {
      content: "Flutter vs React Native in 2024: both are great, but the ecosystem wins for RN.",
      tags: ["Mobile", "React", "Frontend"],
    },
    {
      content:
        "Offline-first architecture is hard, but WatermelonDB makes local sync so much cleaner.",
      tags: ["Mobile", "Architecture", "Database"],
    },
    {
      content:
        "Optimizing iOS app size: removing unused assets and tweaking ProGuard/R8 saved us 15MB.",
      tags: ["iOS", "Android", "Performance"],
    },
    {
      content:
        "Handling deep links cross-platform is still a nightmare. Expo Router is getting us closer to a unified solution.",
      tags: ["Expo", "Navigation", "React"],
    },
  ],
  emma_data: [
    {
      content: "Apache Spark on Kubernetes is underrated. Scales perfectly with workload spikes.",
      tags: ["DevOps", "OpenSource", "Python"],
    },
    {
      content:
        "Polars vs Pandas benchmark: Polars is 10x faster on large datasets. Time to migrate.",
      tags: ["Python", "DataEngineering", "Performance"],
    },
    {
      content:
        "dbt has completely revolutionized our data warehouse workflow. Version control for analytics!",
      tags: ["Analytics", "dbt", "SQL"],
    },
    {
      content:
        "Airflow DAGs can get messy fast. Keep your tasks modular and decouple the logic from the orchestrator.",
      tags: ["Airflow", "DataOps", "Architecture"],
    },
    {
      content:
        "Vector databases are the new hotness for LLMs, but a standard Postgres with pgvector is often enough.",
      tags: ["Database", "AI", "PostgreSQL"],
    },
    {
      content: "Data quality should be checked at the ingestion layer, not downstream. Fail fast.",
      tags: ["DataQuality", "ETL", "BestPractices"],
    },
  ],
}

async function createOrSignIn(user: (typeof USERS)[0]): Promise<{ token: string; userId: string }> {
  const signIn = await req<AuthResponse>("POST", "/api/auth/sign-in", {
    body: { identifier: user.email, password: user.password },
  })

  if (signIn.status === 200 && signIn.data.data?.token) {
    console.log(`  ↩  ${user.username} already exists, signed in`)
    return { token: signIn.data.data.token, userId: signIn.data.data.user?.id ?? "" }
  }

  const signUp = await req<AuthResponse>("POST", "/api/auth/sign-up", {
    body: { username: user.username, email: user.email, password: user.password },
  })

  if (signUp.status !== 201 || !signUp.data.data?.token) {
    throw new Error(`Failed to create user ${user.username}: ${JSON.stringify(signUp.data)}`)
  }
  console.log(`  ✓  ${user.username} created`)
  return { token: signUp.data.data.token, userId: signUp.data.data.user?.id ?? "" }
}

async function ensureProfile(
  token: string,
  userId: string,
  user: (typeof USERS)[0]
): Promise<void> {
  const check = await req("GET", `/api/profiles/${userId}`, { token })
  if (check.status === 200) {
    console.log(`  ↩  profile for ${user.username} already exists`)
    return
  }

  const res = await req("POST", "/api/profiles/", {
    token,
    body: {
      profileId: userId,
      firstName: user.firstName,
      lastName: user.lastName,
      bio: user.bio,
    },
  })
  if (res.status !== 201 && res.status !== 200) {
    console.warn(`  ⚠  profile for ${user.username}, ${res.status}`)
    return
  }
  console.log(`  ✓  profile for ${user.username} created`)
}

async function createPosts(token: string, username: string): Promise<string[]> {
  const posts = POSTS_BY_USER[username] ?? []
  const ids: string[] = []
  for (const post of posts) {
    const res = await req<PostResponse>("POST", "/api/posts/", { token, body: post })
    if (res.status === 201 && res.data.data?._id) {
      console.log(`  ✓  post [${post.tags.join(", ")}]`)
      ids.push(res.data.data._id)
    } else {
      console.warn(`  ⚠  post failed, ${res.status}`)
    }
    await sleep(300)
  }
  return ids
}

async function seedFollows(
  sessions: { token: string; userId: string; username: string }[]
): Promise<void> {
  const FOLLOW_PAIRS: [string, string][] = [
    ["alice_dev", "bob_design"],
    ["alice_dev", "carol_ops"],
    ["bob_design", "alice_dev"],
    ["bob_design", "emma_data"],
    ["carol_ops", "dave_mobile"],
    ["carol_ops", "emma_data"],
    ["dave_mobile", "alice_dev"],
    ["emma_data", "carol_ops"],
  ]

  const byUsername = Object.fromEntries(sessions.map((s) => [s.username, s]))

  for (const [follower, target] of FOLLOW_PAIRS) {
    const followerSession = byUsername[follower]
    const targetSession = byUsername[target]
    if (!followerSession || !targetSession) continue

    const res = await req("POST", "/api/profiles/follow", {
      token: followerSession.token,
      body: { followingId: targetSession.userId },
    })
    if (res.status === 200 || res.status === 201) {
      console.log(`  ✓  ${follower} → ${target}`)
    } else if (res.status === 409) {
      console.log(`  ↩  ${follower} → ${target} already follows`)
    } else {
      console.warn(`  ⚠  follow ${follower}→${target}, ${res.status}`)
    }
    await sleep(400)
  }
}

async function seedLikesAndComments(
  sessions: { token: string; userId: string; username: string }[],
  postIdsByUser: Record<string, string[]>
): Promise<void> {
  const COMMENTS_BY_USER: Record<string, string[]> = {
    alice_dev: [
      "Great post!",
      "Really insightful, thanks!",
      "Have you tried doing this with Next.js?",
      "I ran into a similar issue last week.",
      "This code is super clean.",
    ],
    bob_design: [
      "Love this perspective 🔥",
      "Totally agree!",
      "The contrast ratio here is spot on.",
      "Could use a bit more whitespace, but solid concept.",
      "Saving this to my inspiration board.",
    ],
    carol_ops: [
      "This saved my day.",
      "Bookmarked!",
      "How does this scale in production?",
      "Don't forget to configure the memory limits on this.",
      "Solid pipeline.",
    ],
    dave_mobile: [
      "Useful as always 👍",
      "Been waiting for this.",
      "Does this work on Android as well?",
      "Performance on older devices might be tricky with this approach.",
      "Awesome update.",
    ],
    emma_data: [
      "Nice write-up!",
      "Would love a follow-up post on this.",
      "What's the query execution time looking like?",
      "This approach makes ETL so much easier.",
      "Spot on analysis.",
    ],
  }

  const allPosts: { postId: string; ownerUsername: string }[] = []
  for (const [username, ids] of Object.entries(postIdsByUser)) {
    for (const postId of ids) {
      allPosts.push({ postId, ownerUsername: username })
    }
  }

  for (const session of sessions) {
    const comments = COMMENTS_BY_USER[session.username] ?? []
    let commentIdx = 0

    for (const { postId, ownerUsername } of allPosts) {
      if (ownerUsername === session.username) continue

      const likeRes = await req("POST", `/api/posts/${postId}/likes/`, { token: session.token })
      if (likeRes.status === 201 || likeRes.status === 200) {
        console.log(`  ✓  ${session.username} liked post ${postId.slice(-6)}`)
      } else if (likeRes.status === 409) {
        console.log(`  ↩  ${session.username} already liked ${postId.slice(-6)}`)
      } else {
        console.warn(`  ⚠  like failed, ${likeRes.status}`)
      }
      await sleep(500)

      if (commentIdx < comments.length) {
        const commentRes = await req("POST", `/api/posts/${postId}/comments/`, {
          token: session.token,
          body: { content: comments[commentIdx] },
        })
        if (commentRes.status === 201) {
          console.log(`  ✓  ${session.username} commented on ${postId.slice(-6)}`)
        } else if (commentRes.status === 409) {
          console.log(`  ↩  ${session.username} already commented ${postId.slice(-6)}`)
        } else {
          console.warn(`  ⚠  comment failed, ${commentRes.status}`)
        }
        commentIdx++
        await sleep(500)
      }
    }
  }
}

async function main() {
  console.log(`\n🌱 Breezy seed, targeting ${BASE_URL}\n`)

  const sessions: { token: string; userId: string; username: string }[] = []

  console.log("── Users & profiles ─────────────────────────────")
  for (const user of USERS) {
    const { token, userId } = await createOrSignIn(user)
    await sleep(1200)
    await ensureProfile(token, userId, user)
    sessions.push({ token, userId, username: user.username })
    await sleep(1200)
  }

  console.log("\n── Posts ────────────────────────────────────────")
  const postIdsByUser: Record<string, string[]> = {}
  for (const session of sessions) {
    console.log(`  ${session.username}:`)
    postIdsByUser[session.username] = await createPosts(session.token, session.username)
    await sleep(300)
  }

  console.log("\n── Follows ──────────────────────────────────────")
  await seedFollows(sessions)

  console.log("\n── Likes & comments ─────────────────────────────")
  await seedLikesAndComments(sessions, postIdsByUser)

  console.log("\n✅ Seed complete!\n")
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
