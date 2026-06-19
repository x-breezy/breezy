import { LikeService } from "../../services/like.service"
import { LikeModel } from "../../models/like.model"
import { PostModel } from "../../models/post.model"
import { publish } from "../../clients/rabbitmq"
import { getActorProfile } from "../../clients/grpc.client"

jest.mock("../../models/like.model", () => ({
  LikeModel: {
    create: jest.fn(),
    findOneAndDelete: jest.fn(),
    find: jest.fn(),
  },
}))

jest.mock("../../models/post.model", () => ({
  PostModel: {
    findByIdAndUpdate: jest.fn(),
    findById: jest.fn(),
  },
}))

jest.mock("../../clients/rabbitmq", () => ({ publish: jest.fn() }))

jest.mock("../../clients/grpc.client", () => ({
  getActorProfile: jest.fn(),
}))

const mockedLikeModel = LikeModel as jest.Mocked<typeof LikeModel>
const mockedPostModel = PostModel as jest.Mocked<typeof PostModel>
const mockGetActorProfile = getActorProfile as jest.MockedFunction<typeof getActorProfile>

const NOW = new Date("2026-01-01T00:00:00.000Z")

const MOCK_POST = {
  _id: { toString: () => "post-1" },
  id: "post-1",
  content: "Hello world",
  authorId: "user-2",
  likesCount: 5,
  tags: [],
  media: [],
  createdAt: NOW,
  updatedAt: NOW,
}

function execMock<T>(val: T) {
  const obj = { exec: jest.fn().mockResolvedValue(val) }
  ;(obj as Record<string, unknown>).select = jest.fn().mockReturnValue(obj)
  return obj
}

let service: LikeService

beforeEach(() => {
  jest.clearAllMocks()
  service = new LikeService()
})

describe("like", () => {
  it("creates a like and increments count for non-author", async () => {
    ;(mockedLikeModel.create as jest.Mock).mockResolvedValue({})
    ;(mockedPostModel.findByIdAndUpdate as jest.Mock).mockReturnValue(
      execMock({ ...MOCK_POST, likesCount: 6 })
    )
    mockGetActorProfile
      .mockResolvedValueOnce({ username: "alice", avatarId: "av-1", role: "user" })
      .mockResolvedValueOnce({ username: "bob", avatarId: "av-2", role: "user" })

    const result = await service.like("post-1", "user-1")

    expect(mockedLikeModel.create).toHaveBeenCalledWith({ postId: "post-1", userId: "user-1" })
    expect(mockedPostModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "post-1",
      { $inc: { likesCount: 1 } },
      { new: true }
    )
    expect(mockGetActorProfile).toHaveBeenCalledWith("user-1")
    expect(mockGetActorProfile).toHaveBeenCalledWith("user-2")
    expect(publish).toHaveBeenCalledWith("content.like", {
      actorId: "user-1",
      targetUserId: "user-2",
      postId: "post-1",
      username: "alice",
      avatarId: "av-1",
    })
    expect(result).toEqual({ alreadyLiked: false, nb: 6 })
  })

  it("skips event publish when liking a moderator's post", async () => {
    ;(mockedLikeModel.create as jest.Mock).mockResolvedValue({})
    ;(mockedPostModel.findByIdAndUpdate as jest.Mock).mockReturnValue(
      execMock({ ...MOCK_POST, likesCount: 6 })
    )
    mockGetActorProfile
      .mockResolvedValueOnce({ username: "alice", avatarId: "av-1", role: "user" })
      .mockResolvedValueOnce({ username: "mod", avatarId: "av-2", role: "moderator" })

    const result = await service.like("post-1", "user-1")

    expect(publish).not.toHaveBeenCalled()
    expect(result).toEqual({ alreadyLiked: false, nb: 6 })
  })

  it("skips event publish when liking an admin's post", async () => {
    ;(mockedLikeModel.create as jest.Mock).mockResolvedValue({})
    ;(mockedPostModel.findByIdAndUpdate as jest.Mock).mockReturnValue(
      execMock({ ...MOCK_POST, likesCount: 6 })
    )
    mockGetActorProfile
      .mockResolvedValueOnce({ username: "alice", avatarId: "av-1", role: "user" })
      .mockResolvedValueOnce({ username: "admin", avatarId: "av-2", role: "admin" })

    const result = await service.like("post-1", "user-1")

    expect(publish).not.toHaveBeenCalled()
    expect(result).toEqual({ alreadyLiked: false, nb: 6 })
  })

  it("skips event publish when liking own post", async () => {
    ;(mockedLikeModel.create as jest.Mock).mockResolvedValue({})
    ;(mockedPostModel.findByIdAndUpdate as jest.Mock).mockReturnValue(
      execMock({ ...MOCK_POST, authorId: "user-1", likesCount: 3 })
    )

    await service.like("post-1", "user-1")

    expect(publish).not.toHaveBeenCalled()
    expect(mockGetActorProfile).not.toHaveBeenCalled()
  })

  it("returns alreadyLiked on duplicate (MongoDB error 11000)", async () => {
    ;(mockedLikeModel.create as jest.Mock).mockRejectedValue({ code: 11000 })

    const result = await service.like("post-1", "user-1")

    expect(result).toEqual({ alreadyLiked: true, nb: 0 })
    expect(mockedPostModel.findByIdAndUpdate).not.toHaveBeenCalled()
  })

  it("throws POST_NOT_FOUND when post does not exist after like", async () => {
    ;(mockedLikeModel.create as jest.Mock).mockResolvedValue({})
    ;(mockedPostModel.findByIdAndUpdate as jest.Mock).mockReturnValue(execMock(null))

    await expect(service.like("post-1", "user-1")).rejects.toMatchObject({
      code: "POST_NOT_FOUND",
    })
  })
})

describe("getLikedPostIds", () => {
  it("returns liked post ids", async () => {
    ;(mockedLikeModel.find as jest.Mock).mockReturnValue(
      execMock([{ postId: "p1" }, { postId: "p3" }])
    )

    const result = await service.getLikedPostIds("user-1", ["p1", "p2", "p3", "p4"])

    expect(mockedLikeModel.find).toHaveBeenCalledWith({
      userId: "user-1",
      postId: { $in: ["p1", "p2", "p3", "p4"] },
    })
    expect(result).toEqual(["p1", "p3"])
  })

  it("returns empty array when nothing liked", async () => {
    ;(mockedLikeModel.find as jest.Mock).mockReturnValue(execMock([]))

    const result = await service.getLikedPostIds("user-1", ["p1", "p2"])

    expect(result).toEqual([])
  })
})

describe("unlike", () => {
  it("removes like and decrements count", async () => {
    ;(mockedLikeModel.findOneAndDelete as jest.Mock).mockReturnValue(execMock({ _id: "like-1" }))
    ;(mockedPostModel.findByIdAndUpdate as jest.Mock).mockReturnValue(
      execMock({ ...MOCK_POST, likesCount: 4 })
    )

    const result = await service.unlike("post-1", "user-1")

    expect(mockedLikeModel.findOneAndDelete).toHaveBeenCalledWith({
      postId: "post-1",
      userId: "user-1",
    })
    expect(mockedPostModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "post-1",
      { $inc: { likesCount: -1 } },
      { new: true }
    )
    expect(result).toEqual({ wasLiked: true, nb: 4 })
  })

  it("returns wasLiked: false when like did not exist", async () => {
    ;(mockedLikeModel.findOneAndDelete as jest.Mock).mockReturnValue(execMock(null))

    const result = await service.unlike("post-1", "user-1")

    expect(result).toEqual({ wasLiked: false, nb: 0 })
    expect(mockedPostModel.findByIdAndUpdate).not.toHaveBeenCalled()
  })

  it("throws POST_NOT_FOUND when post is deleted after unlike", async () => {
    ;(mockedLikeModel.findOneAndDelete as jest.Mock).mockReturnValue(execMock({ _id: "like-1" }))
    ;(mockedPostModel.findByIdAndUpdate as jest.Mock).mockReturnValue(execMock(null))

    await expect(service.unlike("post-1", "user-1")).rejects.toMatchObject({
      code: "POST_NOT_FOUND",
    })
  })
})
