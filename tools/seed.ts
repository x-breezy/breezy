import { randomUUID, randomBytes } from "node:crypto"
import { deflateSync } from "node:zlib"
import mongoose from "mongoose"

// Auth service (PostgreSQL / Sequelize)
import {
  connect as connectAuthDB,
  disconnect as disconnectAuthDB,
} from "../apps/auth-service/src/config/database"
import { initUserModel, User } from "../apps/auth-service/src/models/user.model"
import { initReportModel, Report } from "../apps/auth-service/src/models/report.model"
import {
  initEmailVerificationTokenModel,
  EmailVerificationToken,
} from "../apps/auth-service/src/models/email-verification-token.model"
import {
  initPasswordResetTokenModel,
  PasswordResetToken,
} from "../apps/auth-service/src/models/password-reset-token.model"
import {
  initTwoFactorCodeModel,
  TwoFactorCode,
} from "../apps/auth-service/src/models/two-factor-code.model"
import { hashPassword } from "../apps/auth-service/src/utils/password.util"
import { ROLES } from "../apps/auth-service/src/constants/roles"

// Profile service (PostgreSQL / Sequelize)
import {
  connect as connectProfileDB,
  disconnect as disconnectProfileDB,
} from "../apps/profile-service/src/config/database"
import { initProfileModel, Profile } from "../apps/profile-service/src/models/profile.model"
import { initFollowModel, Follow } from "../apps/profile-service/src/models/follow.model"

// Post service (MongoDB / Mongoose)
import {
  connect as connectPostDB,
  disconnect as disconnectPostDB,
} from "../apps/post-service/src/config/database"
import { PostModel } from "../apps/post-service/src/models/post.model"
import { LikeModel } from "../apps/post-service/src/models/like.model"

// Media service (MongoDB / Mongoose)
import {
  connect as connectMediaDB,
  disconnect as disconnectMediaDB,
} from "../apps/media-service/src/config/database"
import { ImageModel } from "../apps/media-service/src/models/image.model"

// Notifications service (MongoDB / Mongoose)
import {
  connect as connectNotifDB,
  disconnect as disconnectNotifDB,
} from "../apps/notifications-service/src/config/database"
import { NotificationModel } from "../apps/notifications-service/src/models/notification.model"

// ── Types ──

interface UserSeed {
  id: string
  username: string
  email: string
  password: string
  role: string
  firstName: string
  lastName: string
  bio: string
  gender: "men" | "women"
  avatarIndex: number
}

interface MediaSeed {
  id: string
  originalName: string
  mimeType: string
  alt: string
  ownerId: string
  color: [number, number, number]
  width: number
  height: number
}

interface PostSeed {
  content: string
  authorUsername: string
  tags: string[]
  mentions: string[]
  media?: { id: string; type: "image" }[]
  parentId?: string
  rootParentId?: string
}

// ── Helpers ──

function crc32(buf: Buffer): number {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]!
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeB = Buffer.from(type, "ascii")
  const crcData = Buffer.concat([typeB, data])
  const crcB = Buffer.alloc(4)
  crcB.writeUInt32BE(crc32(crcData))
  return Buffer.concat([len, typeB, data, crcB])
}

function createMinimalPNG(r: number, g: number, b: number, w = 10, h = 10): Buffer {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  const row = Buffer.alloc(1 + w * 3)
  row[0] = 0
  for (let x = 0; x < w; x++) {
    row[1 + x * 3] = r
    row[2 + x * 3] = g
    row[3 + x * 3] = b
  }
  const raw = Buffer.alloc(h * row.length)
  for (let y = 0; y < h; y++) row.copy(raw, y * row.length)
  const compressed = deflateSync(raw)
  return Buffer.concat([
    sig,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", Buffer.alloc(0)),
  ])
}

function log(msg: string): void {
  console.log(`[seed] ${msg}`)
}

// Generate a MongoDB-compatible 24-char hex ObjectId
function objectId(): string {
  return randomBytes(12).toString("hex")
}

function userId(username: string): string {
  return USERS.find((u) => u.username === username)!.id
}

function userByUsername(username: string): UserSeed {
  const u = USERS.find((u) => u.username === username)
  if (!u) throw new Error(`User ${username} not found`)
  return u
}

function postKey(authorUsername: string, index: number): string {
  return `${authorUsername}-${index}`
}

function parsePostKey(key: string): { authorUsername: string; postIndex: number } {
  const idx = key.lastIndexOf("-")
  return { authorUsername: key.slice(0, idx), postIndex: Number.parseInt(key.slice(idx + 1), 10) }
}

// ── Seed data ──

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "Pass1234"

const USERS: UserSeed[] = [
  // Admin / mod
  {
    id: randomUUID(),
    username: "alex",
    email: "alex@breezy.app",
    password: SEED_PASSWORD,
    role: ROLES.ADMIN,
    firstName: "Alex",
    lastName: "Chen",
    bio: "Building Breezy — the freshest social platform. Tech, design, and good vibes.",
    gender: "men",
    avatarIndex: 32,
  },
  {
    id: randomUUID(),
    username: "jordan",
    email: "jordan@breezy.app",
    password: SEED_PASSWORD,
    role: ROLES.MODERATOR,
    firstName: "Jordan",
    lastName: "Lee",
    bio: "Community moderator. Keeping Breezy safe and friendly for everyone.",
    gender: "men",
    avatarIndex: 45,
  },

  // Tech
  {
    id: randomUUID(),
    username: "james",
    email: "james@breezy.app",
    password: SEED_PASSWORD,
    role: ROLES.USER,
    firstName: "James",
    lastName: "Wilson",
    bio: "Full-stack developer. Open source enthusiast. Coffee-powered code.",
    gender: "men",
    avatarIndex: 12,
  },
  {
    id: randomUUID(),
    username: "david",
    email: "david@breezy.app",
    password: SEED_PASSWORD,
    role: ROLES.USER,
    firstName: "David",
    lastName: "Kim",
    bio: "ML engineer. Teaching machines to understand social graphs.",
    gender: "men",
    avatarIndex: 54,
  },
  {
    id: randomUUID(),
    username: "sarah",
    email: "sarah@breezy.app",
    password: SEED_PASSWORD,
    role: ROLES.USER,
    firstName: "Sarah",
    lastName: "Okafor",
    bio: "DevOps engineer. Kubernetes by day, open source by night.",
    gender: "women",
    avatarIndex: 23,
  },
  {
    id: randomUUID(),
    username: "ananya",
    email: "ananya@breezy.app",
    password: SEED_PASSWORD,
    role: ROLES.USER,
    firstName: "Ananya",
    lastName: "Gupta",
    bio: "Data scientist. Finding patterns in the noise. Women in STEM.",
    gender: "women",
    avatarIndex: 67,
  },

  // Creatives
  {
    id: randomUUID(),
    username: "maya",
    email: "maya@breezy.app",
    password: SEED_PASSWORD,
    role: ROLES.USER,
    firstName: "Maya",
    lastName: "Patel",
    bio: "Photographer & traveler. Light chaser. NYC based, everywhere bound.",
    gender: "women",
    avatarIndex: 15,
  },
  {
    id: randomUUID(),
    username: "priya",
    email: "priya@breezy.app",
    password: SEED_PASSWORD,
    role: ROLES.USER,
    firstName: "Priya",
    lastName: "Sharma",
    bio: "UX designer shaping the future of social media. Pixel perfectionist.",
    gender: "women",
    avatarIndex: 41,
  },
  {
    id: randomUUID(),
    username: "sam",
    email: "sam@breezy.app",
    password: SEED_PASSWORD,
    role: ROLES.USER,
    firstName: "Sam",
    lastName: "Torres",
    bio: "Writer & storyteller. Words are my medium. Working on my first novel.",
    gender: "men",
    avatarIndex: 76,
  },
  {
    id: randomUUID(),
    username: "lena",
    email: "lena@breezy.app",
    password: SEED_PASSWORD,
    role: ROLES.USER,
    firstName: "Lena",
    lastName: "Fischer",
    bio: "Illustrator & digital artist. Neon dreams and pastel screams.",
    gender: "women",
    avatarIndex: 55,
  },
  {
    id: randomUUID(),
    username: "yuki",
    email: "yuki@breezy.app",
    password: SEED_PASSWORD,
    role: ROLES.USER,
    firstName: "Yuki",
    lastName: "Tanaka",
    bio: "Filmmaker & cinematographer. Telling stories one frame at a time.",
    gender: "men",
    avatarIndex: 89,
  },

  // Lifestyle
  {
    id: randomUUID(),
    username: "emma",
    email: "emma@breezy.app",
    password: SEED_PASSWORD,
    role: ROLES.USER,
    firstName: "Emma",
    lastName: "Dubois",
    bio: "Food blogger & home chef. Parisian roots, NYC kitchen.",
    gender: "women",
    avatarIndex: 28,
  },
  {
    id: randomUUID(),
    username: "carlos",
    email: "carlos@breezy.app",
    password: SEED_PASSWORD,
    role: ROLES.USER,
    firstName: "Carlos",
    lastName: "Rivera",
    bio: "Fitness coach. Consistency over intensity. 500 day streak and counting.",
    gender: "men",
    avatarIndex: 61,
  },
  {
    id: randomUUID(),
    username: "zara",
    email: "zara@breezy.app",
    password: SEED_PASSWORD,
    role: ROLES.USER,
    firstName: "Zara",
    lastName: "Ahmed",
    bio: "Fashion & style. Minimalist wardrobe, maximalist dreams.",
    gender: "women",
    avatarIndex: 7,
  },
  {
    id: randomUUID(),
    username: "liam",
    email: "liam@breezy.app",
    password: SEED_PASSWORD,
    role: ROLES.USER,
    firstName: "Liam",
    lastName: "O'Brien",
    bio: "Travel blogger. 30 countries and counting. Next stop: Antarctica.",
    gender: "men",
    avatarIndex: 38,
  },
  {
    id: randomUUID(),
    username: "marcus",
    email: "marcus@breezy.app",
    password: SEED_PASSWORD,
    role: ROLES.USER,
    firstName: "Marcus",
    lastName: "Johnson",
    bio: "Chef & restaurateur. Farm-to-table is not a trend, it's a lifestyle.",
    gender: "men",
    avatarIndex: 83,
  },

  // Others
  {
    id: randomUUID(),
    username: "nina",
    email: "nina@breezy.app",
    password: SEED_PASSWORD,
    role: ROLES.USER,
    firstName: "Nina",
    lastName: "Voss",
    bio: "Psychologist. Digital wellness advocate. Your brain deserves a break.",
    gender: "women",
    avatarIndex: 19,
  },
  {
    id: randomUUID(),
    username: "rajan",
    email: "rajan@breezy.app",
    password: SEED_PASSWORD,
    role: ROLES.USER,
    firstName: "Rajan",
    lastName: "Mehta",
    bio: "Entrepreneur. Bootstrapped to 100k users. Sharing lessons learned.",
    gender: "men",
    avatarIndex: 71,
  },
  {
    id: randomUUID(),
    username: "fatima",
    email: "fatima@breezy.app",
    password: SEED_PASSWORD,
    role: ROLES.USER,
    firstName: "Fatima",
    lastName: "Al-Sayed",
    bio: "Climate scientist. Data-driven optimism. Published in Nature.",
    gender: "women",
    avatarIndex: 93,
  },
  {
    id: randomUUID(),
    username: "ben",
    email: "ben@breezy.app",
    password: SEED_PASSWORD,
    role: ROLES.USER,
    firstName: "Ben",
    lastName: "Carter",
    bio: "High school teacher. Showing kids that code can change the world.",
    gender: "men",
    avatarIndex: 25,
  },
]

// ── Images (using MongoDB-compatible ObjectIds) ──

const IMAGES: MediaSeed[] = [
  // Maya (photographer) — 5 images
  {
    id: objectId(),
    originalName: "golden-hour-brooklyn.png",
    mimeType: "image/png",
    alt: "Golden hour over Brooklyn Bridge",
    ownerId: userId("maya"),
    color: [255, 160, 40],
    width: 80,
    height: 60,
  },
  {
    id: objectId(),
    originalName: "portrait-study.png",
    mimeType: "image/png",
    alt: "Portrait study in natural light",
    ownerId: userId("maya"),
    color: [180, 140, 200],
    width: 60,
    height: 80,
  },
  {
    id: objectId(),
    originalName: "street-nyc.png",
    mimeType: "image/png",
    alt: "Street photography in SoHo",
    ownerId: userId("maya"),
    color: [100, 120, 180],
    width: 80,
    height: 60,
  },
  {
    id: objectId(),
    originalName: "sunset-dunes.png",
    mimeType: "image/png",
    alt: "Sunset over the dunes",
    ownerId: userId("maya"),
    color: [220, 80, 50],
    width: 80,
    height: 60,
  },
  {
    id: objectId(),
    originalName: "urban-symmetry.png",
    mimeType: "image/png",
    alt: "Urban symmetry architecture",
    ownerId: userId("maya"),
    color: [160, 180, 200],
    width: 60,
    height: 80,
  },

  // Lena (illustrator) — 3 images
  {
    id: objectId(),
    originalName: "neon-dreams.png",
    mimeType: "image/png",
    alt: "Neon Dreams illustration series",
    ownerId: userId("lena"),
    color: [0, 200, 200],
    width: 60,
    height: 60,
  },
  {
    id: objectId(),
    originalName: "sketch-study.png",
    mimeType: "image/png",
    alt: "Life sketch study",
    ownerId: userId("lena"),
    color: [200, 150, 100],
    width: 60,
    height: 80,
  },
  {
    id: objectId(),
    originalName: "digital-flora.png",
    mimeType: "image/png",
    alt: "Digital flora pattern",
    ownerId: userId("lena"),
    color: [100, 200, 150],
    width: 80,
    height: 80,
  },

  // Emma (food blogger) — 3 images
  {
    id: objectId(),
    originalName: "truffle-pasta.png",
    mimeType: "image/png",
    alt: "Homemade truffle pasta",
    ownerId: userId("emma"),
    color: [220, 180, 100],
    width: 80,
    height: 60,
  },
  {
    id: objectId(),
    originalName: "chocolate-fondant.png",
    mimeType: "image/png",
    alt: "Perfect chocolate fondant",
    ownerId: userId("emma"),
    color: [80, 40, 20],
    width: 60,
    height: 60,
  },
  {
    id: objectId(),
    originalName: "summer-salad.png",
    mimeType: "image/png",
    alt: "Fresh summer salad",
    ownerId: userId("emma"),
    color: [100, 200, 80],
    width: 80,
    height: 60,
  },

  // Liam (travel) — 2 images
  {
    id: objectId(),
    originalName: "machu-picchu.png",
    mimeType: "image/png",
    alt: "Sunrise over Machu Picchu",
    ownerId: userId("liam"),
    color: [140, 160, 120],
    width: 80,
    height: 60,
  },
  {
    id: objectId(),
    originalName: "bangkok-market.png",
    mimeType: "image/png",
    alt: "Street food market in Bangkok",
    ownerId: userId("liam"),
    color: [200, 100, 60],
    width: 80,
    height: 60,
  },

  // Others — 1 each
  {
    id: objectId(),
    originalName: "dark-mode-preview.png",
    mimeType: "image/png",
    alt: "Dark mode UI preview",
    ownerId: userId("alex"),
    color: [30, 30, 50],
    width: 80,
    height: 60,
  },
  {
    id: objectId(),
    originalName: "onboarding-flow.png",
    mimeType: "image/png",
    alt: "New onboarding flow design",
    ownerId: userId("priya"),
    color: [60, 80, 200],
    width: 80,
    height: 60,
  },
  {
    id: objectId(),
    originalName: "short-film-still.png",
    mimeType: "image/png",
    alt: "Still from Kyoto short film",
    ownerId: userId("yuki"),
    color: [180, 60, 60],
    width: 80,
    height: 45,
  },
  {
    id: objectId(),
    originalName: "steak-plating.png",
    mimeType: "image/png",
    alt: "Perfect steak plating",
    ownerId: userId("marcus"),
    color: [120, 60, 40],
    width: 80,
    height: 60,
  },
]

// ── Follow graph ──

const FOLLOW_GRAPH: Record<string, string[]> = {
  alex: [
    "maya",
    "james",
    "priya",
    "sam",
    "jordan",
    "david",
    "sarah",
    "ananya",
    "lena",
    "yuki",
    "emma",
    "carlos",
    "zara",
    "liam",
    "marcus",
    "nina",
    "rajan",
    "fatima",
    "ben",
  ],
  jordan: [
    "alex",
    "james",
    "david",
    "sarah",
    "ananya",
    "maya",
    "priya",
    "sam",
    "lena",
    "yuki",
    "emma",
    "carlos",
    "zara",
    "liam",
    "marcus",
    "nina",
    "rajan",
    "fatima",
    "ben",
  ],
  james: ["alex", "jordan", "maya", "priya", "david", "sarah", "ananya"],
  david: ["alex", "jordan", "james", "sarah", "ananya", "maya"],
  sarah: ["alex", "jordan", "james", "david", "ananya", "maya", "priya"],
  ananya: ["alex", "jordan", "james", "david", "sarah", "maya"],
  maya: ["alex", "jordan", "priya", "lena", "sam", "james", "yuki", "emma", "liam"],
  priya: ["alex", "jordan", "maya", "lena", "sam", "james", "zara"],
  sam: ["alex", "jordan", "maya", "priya", "lena", "nina"],
  lena: ["alex", "jordan", "maya", "priya", "sam", "yuki"],
  yuki: ["alex", "jordan", "maya", "lena"],
  emma: ["alex", "jordan", "maya", "carlos", "zara", "liam", "marcus"],
  carlos: ["alex", "jordan", "emma", "zara", "liam", "marcus"],
  zara: ["alex", "jordan", "emma", "carlos", "priya", "liam"],
  liam: ["alex", "jordan", "emma", "carlos", "zara", "marcus", "maya"],
  marcus: ["alex", "jordan", "emma", "carlos", "liam"],
  nina: ["alex", "jordan", "maya", "sam"],
  rajan: ["alex", "jordan", "james", "sarah", "ananya"],
  fatima: ["alex", "jordan", "maya", "david", "ananya"],
  ben: ["alex", "jordan", "maya", "sam", "nina"],
}

// ── Posts (media refs will be resolved at runtime) ──

const POSTS: PostSeed[] = [
  // Alex — 2 posts
  {
    content:
      "Excited to announce dark mode on Breezy! Took a few late nights but we think you'll love it. #Breezy #Update",
    authorUsername: "alex",
    tags: ["Breezy", "Update"],
    mentions: [],
    media: [],
  },
  {
    content:
      "Welcome to all our new users! We hit 10k this week. Amazing community growing here. #Breezy #Milestone",
    authorUsername: "alex",
    tags: ["Breezy", "Milestone"],
    mentions: [],
  },

  // Maya — 3 posts
  {
    content:
      "Golden hour at Brooklyn Bridge today. Sometimes you just have to stop and appreciate the light. #photography #NYC #goldenhour",
    authorUsername: "maya",
    tags: ["photography", "NYC", "goldenhour"],
    mentions: [],
    media: [],
  },
  {
    content:
      "Film vs digital — why not both? Shot this on my Leica M6 and edited on Lightroom. #photography #film",
    authorUsername: "maya",
    tags: ["photography", "film"],
    mentions: [],
    media: [],
  },
  {
    content:
      "Anyone else obsessed with the new Breezy widget? @alex @priya you outdid yourselves! #Breezy #design",
    authorUsername: "maya",
    tags: ["Breezy", "design"],
    mentions: ["alex", "priya"],
  },

  // James — 3 posts
  {
    content:
      "Just shipped a new open source project — a lightweight rate limiter for Express APIs. Check it out! #opensource #nodejs #typescript",
    authorUsername: "james",
    tags: ["opensource", "nodejs", "typescript"],
    mentions: [],
  },
  {
    content:
      "Spent the weekend refactoring the entire auth pipeline. Went from 12 files to 4. Clean code > clever code. #typescript #dev",
    authorUsername: "james",
    tags: ["typescript", "dev"],
    mentions: [],
  },
  {
    content:
      "Dark mode is a game changer! Been testing it all week. Great work team @alex! #Breezy #dev",
    authorUsername: "james",
    tags: ["Breezy", "dev"],
    mentions: ["alex"],
  },

  // Priya — 2 posts
  {
    content:
      "Spent the week redesigning our onboarding flow. First impressions matter! Here's a sneak peek. #design #UX #Breezy",
    authorUsername: "priya",
    tags: ["design", "UX", "Breezy"],
    mentions: [],
    media: [],
  },
  {
    content:
      "Color palette exploration for Q2. We're going warmer, more organic. What do you think? #design #colortheory",
    authorUsername: "priya",
    tags: ["design", "colortheory"],
    mentions: [],
  },

  // Sam — 2 posts
  {
    content:
      "Morning pages are non-negotiable. Day 347 of stream-of-consciousness before the world gets loud. #writing #morningpages",
    authorUsername: "sam",
    tags: ["writing", "morningpages"],
    mentions: [],
  },
  {
    content:
      "Just finished Project Hail Mary by Andy Weir. If you haven't read it yet, do yourself a favor. 5/5 stars. #books #scifi",
    authorUsername: "sam",
    tags: ["books", "scifi"],
    mentions: [],
  },

  // Jordan — 2 posts
  {
    content:
      "New community guidelines are live! Updated our policies on harassment and misinformation. Let's keep Breezy positive. #community #safety",
    authorUsername: "jordan",
    tags: ["community", "safety"],
    mentions: [],
  },
  {
    content:
      "Reminder: if you see something, say something. Reports are anonymous and reviewed within 24 hours. #Breezy #safety",
    authorUsername: "jordan",
    tags: ["Breezy", "safety"],
    mentions: [],
  },

  // David — 1 post
  {
    content:
      "Training a recommendation model on Breezy engagement patterns. The data is fascinating — users are most active at 8pm. #ML #Breezy #data",
    authorUsername: "david",
    tags: ["ML", "Breezy", "data"],
    mentions: [],
  },

  // Sarah — 1 post
  {
    content:
      "Just migrated our entire infrastructure to Kubernetes. Zero downtime. Feeling proud of the team. #devops #kubernetes #cloud",
    authorUsername: "sarah",
    tags: ["devops", "kubernetes", "cloud"],
    mentions: [],
  },

  // Ananya — 1 post
  {
    content:
      "Analyzed engagement patterns across 10k users. Peak activity at 8pm with a secondary spike at noon. Insights incoming! #data #analytics",
    authorUsername: "ananya",
    tags: ["data", "analytics"],
    mentions: [],
  },

  // Lena — 2 posts
  {
    content:
      "New illustration series: Neon Dreams. Here's the first piece. Feedback welcome! #art #illustration #design",
    authorUsername: "lena",
    tags: ["art", "illustration", "design"],
    mentions: [],
    media: [],
  },
  {
    content:
      "@priya love the new color palette! Here's something I've been working on with similar warm tones. #design #art",
    authorUsername: "lena",
    tags: ["design", "art"],
    mentions: ["priya"],
    media: [],
  },

  // Yuki — 1 post
  {
    content:
      "Just wrapped shooting a short film in Kyoto. The autumn colors were absolutely unbelievable. #filmmaking #Kyoto #cinematography",
    authorUsername: "yuki",
    tags: ["filmmaking", "Kyoto", "cinematography"],
    mentions: [],
    media: [],
  },

  // Emma — 2 posts
  {
    content:
      "Homemade truffle pasta from scratch. 30 minutes, 10 ingredients, pure magic. Recipe coming soon! #cooking #pasta #food",
    authorUsername: "emma",
    tags: ["cooking", "pasta", "food"],
    mentions: [],
    media: [],
  },
  {
    content:
      "The perfect chocolate fondant. @marcus what do you think? #baking #dessert #chocolate",
    authorUsername: "emma",
    tags: ["baking", "dessert", "chocolate"],
    mentions: ["marcus"],
    media: [],
  },

  // Carlos — 1 post
  {
    content:
      "Consistency over intensity. 500 days streak today. Showing up is half the battle. #fitness #discipline #health",
    authorUsername: "carlos",
    tags: ["fitness", "discipline", "health"],
    mentions: [],
  },

  // Zara — 1 post
  {
    content:
      "Spring capsule wardrobe: 15 pieces, endless combinations. Who says minimalism is boring? #fashion #style #minimalism",
    authorUsername: "zara",
    tags: ["fashion", "style", "minimalism"],
    mentions: [],
  },

  // Liam — 2 posts
  {
    content: "Sunrise over Machu Picchu. Some places change you forever. #travel #Peru #adventure",
    authorUsername: "liam",
    tags: ["travel", "Peru", "adventure"],
    mentions: [],
    media: [],
  },
  {
    content:
      "Street food market in Bangkok. @emma you'd love this place! The flavors are incredible. #travel #food #Bangkok",
    authorUsername: "liam",
    tags: ["travel", "food", "Bangkok"],
    mentions: ["emma"],
    media: [],
  },

  // Marcus — 1 post
  {
    content:
      "The secret to a perfect steak: let it rest. Patience is the most underrated ingredient. #cooking #steak #tips",
    authorUsername: "marcus",
    tags: ["cooking", "steak", "tips"],
    mentions: [],
    media: [],
  },

  // Nina — 1 post
  {
    content:
      "Digital wellness tip: schedule phone-free hours. Your brain will thank you. Start with one hour before bed. #wellness #mentalhealth",
    authorUsername: "nina",
    tags: ["wellness", "mentalhealth"],
    mentions: [],
  },

  // Rajan — 1 post
  {
    content:
      "Bootstrapped from 0 to 100k users. The single biggest lesson: talk to your users every single day. #startup #entrepreneurship",
    authorUsername: "rajan",
    tags: ["startup", "entrepreneurship"],
    mentions: [],
  },

  // Fatima — 1 post
  {
    content:
      "Published my paper on climate modeling! Years of work finally out in the world. #science #climate #research",
    authorUsername: "fatima",
    tags: ["science", "climate", "research"],
    mentions: [],
  },

  // Ben — 1 post
  {
    content:
      "My students built their first web app today. A full-stack CRUD app. I've never been prouder. The future is bright! #teaching #coding #education",
    authorUsername: "ben",
    tags: ["teaching", "coding", "education"],
    mentions: [],
  },

  // Threaded replies (indices 29-34)
  {
    content:
      "The new onboarding looks incredible Priya! The illustration style really sets the tone. @priya #design",
    authorUsername: "alex",
    tags: ["design"],
    mentions: ["priya"],
  },
  {
    content:
      "The widget API was fun to build! Glad you're enjoying it @maya. More features coming soon! #Breezy",
    authorUsername: "james",
    tags: ["Breezy"],
    mentions: ["maya"],
  },
  {
    content: "@emma your truffle pasta looks incredible! Would love the recipe. #cooking #food",
    authorUsername: "marcus",
    tags: ["cooking", "food"],
    mentions: ["emma"],
  },
  {
    content:
      "@maya your photography is pure inspiration. Would love to collaborate on a photo essay someday. #photography #writing",
    authorUsername: "sam",
    tags: ["photography", "writing"],
    mentions: ["maya"],
  },
  {
    content:
      "@fatima congratulations on the publication! Climate modeling is vital work. #science #climate",
    authorUsername: "alex",
    tags: ["science", "climate"],
    mentions: ["fatima"],
  },
  {
    content:
      "@ben that's amazing! Your students are lucky to have you. What framework did they use? #teaching #coding",
    authorUsername: "james",
    tags: ["teaching", "coding"],
    mentions: ["ben"],
  },
]

// ── Like distribution ──

const LIKE_GRAPH: Record<string, string[]> = {
  alex: [
    "maya-0",
    "maya-1",
    "maya-2",
    "priya-0",
    "priya-1",
    "sam-0",
    "sam-1",
    "lena-0",
    "lena-1",
    "emma-0",
    "emma-1",
    "liam-0",
  ],
  jordan: [
    "alex-0",
    "james-0",
    "james-1",
    "maya-0",
    "maya-1",
    "priya-0",
    "sam-0",
    "lena-0",
    "nina-0",
    "rajan-0",
    "ben-0",
  ],
  james: [
    "alex-0",
    "alex-1",
    "maya-0",
    "maya-2",
    "priya-0",
    "priya-1",
    "lena-0",
    "lena-1",
    "emma-0",
    "sarah-0",
    "liam-0",
  ],
  david: ["alex-0", "james-0", "james-1", "maya-0", "maya-1", "sarah-0", "ananya-0", "lena-0"],
  sarah: ["alex-0", "james-0", "james-1", "david-0", "maya-0", "maya-1", "lena-0", "emma-0"],
  ananya: ["alex-0", "james-0", "maya-0", "maya-1", "priya-0", "lena-0", "fatima-0"],
  maya: [
    "alex-0",
    "alex-1",
    "james-0",
    "james-1",
    "priya-0",
    "sam-0",
    "lena-0",
    "lena-1",
    "emma-0",
    "yuki-0",
    "liam-0",
    "liam-1",
  ],
  priya: [
    "alex-0",
    "alex-1",
    "james-0",
    "maya-0",
    "maya-1",
    "maya-2",
    "sam-0",
    "lena-0",
    "lena-1",
    "zara-0",
    "liam-0",
    "emma-0",
  ],
  sam: [
    "alex-0",
    "maya-0",
    "maya-1",
    "maya-2",
    "priya-0",
    "lena-0",
    "lena-1",
    "emma-0",
    "nina-0",
    "liam-0",
    "liam-1",
  ],
  lena: ["alex-0", "maya-0", "maya-1", "priya-0", "priya-1", "sam-0", "emma-0", "yuki-0", "liam-0"],
  yuki: ["alex-0", "maya-0", "maya-1", "lena-0", "lena-1", "liam-0"],
  emma: [
    "alex-0",
    "maya-0",
    "maya-1",
    "maya-2",
    "lena-0",
    "carlos-0",
    "zara-0",
    "liam-0",
    "liam-1",
    "marcus-0",
  ],
  carlos: ["alex-0", "emma-0", "emma-1", "zara-0", "liam-0", "liam-1", "marcus-0"],
  zara: ["alex-0", "priya-0", "priya-1", "emma-0", "emma-1", "lena-0", "liam-0", "liam-1"],
  liam: [
    "alex-0",
    "maya-0",
    "maya-1",
    "maya-2",
    "priya-0",
    "emma-0",
    "emma-1",
    "marcus-0",
    "yuki-0",
    "lena-0",
  ],
  marcus: ["alex-0", "emma-0", "emma-1", "carlos-0", "liam-0", "liam-1"],
  nina: ["alex-0", "maya-0", "maya-1", "sam-0", "sam-1", "lena-0"],
  rajan: ["alex-0", "alex-1", "james-0", "james-1", "sarah-0", "david-0"],
  fatima: ["alex-0", "maya-0", "maya-1", "david-0", "ananya-0", "lena-0", "liam-0"],
  ben: ["alex-0", "maya-0", "maya-1", "sam-0", "sam-1", "lena-0", "nina-0", "liam-0", "emma-0"],
}

// ── Main seed function ──

async function main(): Promise<void> {
  const authUrl =
    process.env.AUTH_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5433/user_service"
  const profileUrl =
    process.env.PROFILE_DATABASE_URL ??
    "postgres://postgres:postgres@localhost:5434/profile_service"
  const postUrl = process.env.POST_DATABASE_URL ?? "mongodb://localhost:27017/post_service"
  const mediaUrl = process.env.MEDIA_DATABASE_URL ?? "mongodb://localhost:27018/media_service"
  const notifUrl =
    process.env.NOTIF_DATABASE_URL ?? "mongodb://localhost:27019/notifications_service"

  // 1. Connect to PostgreSQL databases
  log("Connecting to PostgreSQL databases...")

  const authSeq = await connectAuthDB(authUrl)
  log("Auth PostgreSQL connected")

  const profileSeq = await connectProfileDB(profileUrl)
  log("Profile PostgreSQL connected")

  // 2. Initialize all models
  log("Initializing models...")

  initUserModel(authSeq)
  initReportModel(authSeq)
  initEmailVerificationTokenModel(authSeq)
  initPasswordResetTokenModel(authSeq)
  initTwoFactorCodeModel(authSeq)
  log("Auth models initialized")

  initFollowModel(profileSeq)
  initProfileModel(profileSeq)
  log("Profile models initialized")

  await authSeq.sync()
  await profileSeq.sync()
  log("Tables synced")

  // 3. Clear all existing data (idempotent)
  log("Clearing existing data...")

  await EmailVerificationToken.destroy({ truncate: true, cascade: true })
  await PasswordResetToken.destroy({ truncate: true, cascade: true })
  await TwoFactorCode.destroy({ truncate: true, cascade: true })
  await Report.destroy({ truncate: true, cascade: true })
  await User.destroy({ truncate: true, cascade: true })
  log("Auth data cleared")

  await Follow.destroy({ where: {}, force: true })
  await Profile.destroy({ where: {}, force: true })
  log("Profile data cleared")

  // 4. Seed users
  log("Seeding 20 users...")
  const hashedPassword = await hashPassword(SEED_PASSWORD)

  for (const u of USERS) {
    await User.create({
      id: u.id,
      username: u.username,
      email: u.email,
      passwordHash: hashedPassword,
      role: u.role,
      isBanned: false,
      isSuspended: false,
      isEmailVerified: true,
      twoFactorEnabled: false,
      googleId: null,
    })
  }
  log("Users created")

  // 5. Seed profiles
  log("Seeding 20 profiles...")
  for (const u of USERS) {
    const avatarUrl = `https://randomuser.me/api/portraits/${u.gender}/${u.avatarIndex}.jpg`
    await Profile.create({
      profileId: u.id,
      username: u.username,
      firstName: u.firstName,
      lastName: u.lastName,
      bio: u.bio,
      role: u.role,
      avatarId: avatarUrl,
      followersCount: 0,
      followingCount: 0,
    })
  }
  log("Profiles created")

  // 6. Seed images (separate MongoDB instance)
  log(`Connecting to media MongoDB...`)
  await mongoose.disconnect()
  await connectMediaDB(mediaUrl)
  await ImageModel.deleteMany({})
  log("Media data cleared")
  log(`Seeding ${IMAGES.length} images...`)
  const imageIdMap: Record<string, string> = {}

  for (const m of IMAGES) {
    const data = createMinimalPNG(m.color[0], m.color[1], m.color[2], m.width, m.height)
    const doc = await ImageModel.create({
      _id: new mongoose.Types.ObjectId(m.id),
      data,
      originalName: m.originalName,
      mimeType: m.mimeType,
      size: data.length,
      width: m.width,
      height: m.height,
      alt: m.alt,
      ownerId: m.ownerId,
    })
    imageIdMap[m.id] = doc._id.toString()
  }
  log("Images created")

  // Map image references to posts using the seeded image IDs
  function imgRef(username: string, index: number): { id: string; type: "image" } {
    const userImages = IMAGES.filter((m) => m.ownerId === userId(username))
    const m = userImages[index]
    if (!m) throw new Error(`Image index ${index} not found for ${username}`)
    return { id: imageIdMap[m.id]!, type: "image" }
  }

  const POST_MEDIA: Record<string, { id: string; type: "image" }[]> = {
    "alex-0": [imgRef("alex", 0)],
    "maya-0": [imgRef("maya", 0)],
    "maya-1": [imgRef("maya", 1)],
    "priya-0": [imgRef("priya", 0)],
    "lena-0": [imgRef("lena", 0)],
    "lena-1": [imgRef("lena", 2)],
    "yuki-0": [imgRef("yuki", 0)],
    "emma-0": [imgRef("emma", 0)],
    "emma-1": [imgRef("emma", 1)],
    "liam-0": [imgRef("liam", 0)],
    "liam-1": [imgRef("liam", 1)],
    "marcus-0": [imgRef("marcus", 0)],
  }

  // 7. Seed follows (PostgreSQL)
  log("Seeding follows...")
  const followCount: Record<string, { following: number; followers: number }> = {}
  for (const u of USERS) {
    followCount[u.username] = { following: 0, followers: 0 }
  }

  for (const [followerUsername, followingList] of Object.entries(FOLLOW_GRAPH)) {
    for (const followingUsername of followingList) {
      await Follow.create({
        followerId: userId(followerUsername),
        followingId: userId(followingUsername),
      })
      followCount[followerUsername]!.following++
      followCount[followingUsername]!.followers++
    }
  }

  for (const u of USERS) {
    const counts = followCount[u.username]!
    await Profile.update(
      { followersCount: counts.followers, followingCount: counts.following },
      { where: { profileId: u.id } }
    )
  }
  const totalFollows = Object.values(FOLLOW_GRAPH).reduce((sum, list) => sum + list.length, 0)
  log(`${totalFollows} follows created`)

  // 8. Seed posts (separate MongoDB instance)
  log("Connecting to post MongoDB...")
  await mongoose.disconnect()
  await connectPostDB(postUrl)
  await PostModel.deleteMany({})
  await LikeModel.deleteMany({})
  log("Post data cleared")
  log(`Seeding ${POSTS.length} posts...`)
  const postMap: Record<string, string> = {}

  const authorPostIdx: Record<string, number> = {}

  for (let i = 0; i < POSTS.length; i++) {
    const p = POSTS[i]!
    const aIdx = authorPostIdx[p.authorUsername] ?? 0
    authorPostIdx[p.authorUsername] = aIdx + 1
    const key = postKey(p.authorUsername, aIdx)
    const media = POST_MEDIA[key] ?? []

    const post = await PostModel.create({
      content: p.content,
      authorId: userByUsername(p.authorUsername).id,
      tags: p.tags,
      mentions: p.mentions.map((username) => userId(username)),
      media,
      parentId: p.parentId ?? null,
      rootParentId: p.rootParentId ?? null,
      likesCount: 0,
      commentsCount: 0,
    })
    postMap[key] = post._id.toString()
  }

  // Wire up threaded replies (reply global index -> parent per-author key)
  const REPLY_PARENTS: Record<number, string> = {
    31: "priya-0",
    32: "maya-2",
    33: "emma-0",
    34: "maya-0",
    35: "fatima-0",
    36: "ben-0",
  }

  for (const [replyGlobalIdx, parentKey] of Object.entries(REPLY_PARENTS)) {
    const parentId = postMap[parentKey]
    if (!parentId) {
      log(`WARN: parent post ${parentKey} not found for reply at global index ${replyGlobalIdx}`)
      continue
    }

    const replyPost = POSTS[Number(replyGlobalIdx)]
    if (!replyPost) continue

    const replyDoc = await PostModel.findOne({ content: replyPost.content }).sort({ createdAt: -1 })
    if (replyDoc) {
      replyDoc.parentId = parentId
      replyDoc.rootParentId = parentId
      await replyDoc.save()
      await PostModel.findByIdAndUpdate(parentId, { $inc: { commentsCount: 1 } })
    }
  }

  // 9. Seed likes
  log("Seeding likes...")
  let likeTotal = 0

  for (const [username, likedKeys] of Object.entries(LIKE_GRAPH)) {
    for (const key of likedKeys) {
      const { authorUsername, postIndex } = parsePostKey(key)
      const pKey = postKey(authorUsername, postIndex)
      const postId = postMap[pKey]
      if (!postId) {
        log(`WARN: post key ${pKey} not found for like by ${username}`)
        continue
      }

      const existing = await LikeModel.findOne({ postId, userId: userId(username) })
      if (!existing) {
        await LikeModel.create({ postId, userId: userId(username) })
        likeTotal++
      }
    }
  }
  log(`${likeTotal} likes created`)

  // Update likesCount on each post
  log("Updating like counts...")
  for (const postId of Object.values(postMap)) {
    const count = await LikeModel.countDocuments({ postId })
    await PostModel.findByIdAndUpdate(postId, { likesCount: count })
  }

  // 10. Seed notifications (separate MongoDB instance)
  log("Connecting to notifications MongoDB...")
  await mongoose.disconnect()
  await connectNotifDB(notifUrl)
  await NotificationModel.deleteMany({})
  log("Notifications data cleared")
  log("Seeding notifications...")

  const alexId = userId("alex")
  const jamesId = userId("james")
  const mayaId = userId("maya")
  const samId = userId("sam")
  const priyaId = userId("priya")
  const emmaId = userId("emma")
  const ninaId = userId("nina")
  const liamId = userId("liam")

  // Follow notifications
  await NotificationModel.create({
    userId: alexId,
    type: "follow",
    read: false,
    payload: { followerId: mayaId, username: "maya" },
  })
  await NotificationModel.create({
    userId: alexId,
    type: "follow",
    read: false,
    payload: { followerId: jamesId, username: "james" },
  })
  await NotificationModel.create({
    userId: mayaId,
    type: "follow",
    read: false,
    payload: { followerId: priyaId, username: "priya" },
  })
  await NotificationModel.create({
    userId: mayaId,
    type: "follow",
    read: false,
    payload: { followerId: liamId, username: "liam" },
  })
  await NotificationModel.create({
    userId: samId,
    type: "follow",
    read: false,
    payload: { followerId: ninaId, username: "nina" },
  })

  // Like notifications
  const mayaPost0 = postMap["maya-0"]
  const mayaPost1 = postMap["maya-1"]
  const alexPost0 = postMap["alex-0"]
  const priyaPost0 = postMap["priya-0"]
  const samPost0 = postMap["sam-0"]

  if (mayaPost0) {
    await NotificationModel.create({
      userId: mayaId,
      type: "like",
      read: false,
      payload: { actorId: alexId, postId: mayaPost0, username: "alex" },
    })
    await NotificationModel.create({
      userId: mayaId,
      type: "like",
      read: false,
      payload: { actorId: samId, postId: mayaPost0, username: "sam" },
    })
  }
  if (mayaPost1) {
    await NotificationModel.create({
      userId: mayaId,
      type: "like",
      read: false,
      payload: { actorId: jamesId, postId: mayaPost1, username: "james" },
    })
  }
  if (alexPost0) {
    await NotificationModel.create({
      userId: alexId,
      type: "like",
      read: false,
      payload: { actorId: mayaId, postId: alexPost0, username: "maya" },
    })
  }
  if (priyaPost0) {
    await NotificationModel.create({
      userId: priyaId,
      type: "like",
      read: false,
      payload: { actorId: alexId, postId: priyaPost0, username: "alex" },
    })
  }
  if (samPost0) {
    await NotificationModel.create({
      userId: samId,
      type: "like",
      read: false,
      payload: { actorId: mayaId, postId: samPost0, username: "maya" },
    })
  }

  // Mention notifications
  const mayaPost2 = postMap["maya-2"]
  const jamesPost2 = postMap["james-2"]
  const emmaPost1 = postMap["emma-1"]

  if (mayaPost2) {
    await NotificationModel.create({
      userId: alexId,
      type: "mention",
      read: false,
      payload: { actorId: mayaId, postId: mayaPost2, username: "maya" },
    })
    await NotificationModel.create({
      userId: priyaId,
      type: "mention",
      read: false,
      payload: { actorId: mayaId, postId: mayaPost2, username: "maya" },
    })
  }
  if (jamesPost2) {
    await NotificationModel.create({
      userId: alexId,
      type: "mention",
      read: false,
      payload: { actorId: jamesId, postId: jamesPost2, username: "james" },
    })
  }

  // Comment/reply notifications
  const replyPost0 = postMap["alex-29"]
  const replyPost1 = postMap["james-30"]

  if (replyPost0) {
    await NotificationModel.create({
      userId: priyaId,
      type: "comment",
      read: false,
      payload: { actorId: alexId, postId: replyPost0, username: "alex" },
    })
  }
  if (replyPost1) {
    await NotificationModel.create({
      userId: mayaId,
      type: "comment",
      read: false,
      payload: { actorId: jamesId, postId: replyPost1, username: "james" },
    })
  }

  log("Notifications created")

  // Summary
  log("")
  log("── Seed complete ──")
  log(`Users: ${USERS.length}`)
  log(`Profiles: ${USERS.length}`)
  log(`Images: ${IMAGES.length}`)
  log(`Follows: ${totalFollows}`)
  log(`Posts: ${POSTS.length}`)
  log(`Likes: ${likeTotal}`)
  log("")

  // Disconnect
  await mongoose.disconnect()
  await disconnectAuthDB()
  await disconnectProfileDB()
  log("Disconnected from all databases")
}

main().catch((err) => {
  console.error("[seed] Fatal error:", err)
  process.exit(1)
})
