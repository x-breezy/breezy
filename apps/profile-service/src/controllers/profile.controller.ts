import { NextFunction, Request, Response } from "express"
import ProfileService from "../services/profile.service"
import type { CreateProfileDTO, UpdateProfileDTO, FollowDTO } from "../schema/profile.schema"

class ProfileController {
  private profileService: ProfileService

  constructor(profileService: ProfileService) {
    this.profileService = profileService
  }

  createProfile = async (
    req: Request<Record<string, never>, unknown, CreateProfileDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const profile = await this.profileService.createProfile(req.body)
      res.status(201).json({ success: true, data: profile })
    } catch (err) {
      next(err)
    }
  }

  getProfile = async (
    req: Request<{ profileId: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const profile = await this.profileService.getProfile(req.params.profileId)
      if (!profile) {
        res.status(404).json({ success: false, message: "Profile not found" })
        return
      }
      res
        .status(200)
        .json({ success: true, data: profile, message: "Profile retrieved successfully" })
    } catch (err) {
      next(err)
    }
  }

  getProfileByUsername = async (
    req: Request<{ username: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const profile = await this.profileService.getProfileByUsername(req.params.username)
      if (!profile) {
        res.status(404).json({ success: false, message: "Profile not found" })
        return
      }
      res
        .status(200)
        .json({ success: true, data: profile, message: "Profile retrieved successfully" })
    } catch (err) {
      next(err)
    }
  }

  updateProfile = async (
    req: Request<Record<string, never>, unknown, UpdateProfileDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const updated = await this.profileService.updateProfile(req.user!.id, req.body)
      if (!updated) {
        res.status(404).json({ success: false, message: "Profile not found" })
        return
      }
      res
        .status(200)
        .json({ success: true, data: updated, message: "Profile updated successfully" })
    } catch (err) {
      next(err)
    }
  }

  deleteProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deleted = await this.profileService.deleteProfile(req.user!.id)
      if (!deleted) {
        res.status(404).json({ success: false, message: "Profile not found" })
        return
      }
      res.status(204).send({ success: true, message: "Profile deleted successfully" })
    } catch (err) {
      next(err)
    }
  }

  follow = async (
    req: Request<Record<string, never>, unknown, FollowDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const followerId = req.user!.id

    if (followerId === req.body.followingId) {
      res.status(400).json({ success: false, message: "Cannot follow yourself" })
      return
    }

    try {
      await this.profileService.follow(followerId, req.body.followingId)
      res.status(201).json({ success: true, message: "Followed successfully" })
    } catch (err) {
      if ((err as { name?: string }).name === "SequelizeUniqueConstraintError") {
        res.status(409).json({ success: false, message: "Already following" })
        return
      }
      next(err)
    }
  }

  unfollow = async (
    req: Request<Record<string, never>, unknown, FollowDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const unfollowed = await this.profileService.unfollow(req.user!.id, req.body.followingId)
      if (!unfollowed) {
        res.status(404).json({ success: false, message: "Follow relation not found" })
        return
      }
      res.status(200).json({ success: true, message: "Unfollowed successfully" })
    } catch (err) {
      next(err)
    }
  }

  isFollowing = async (
    req: Request<{ profileId: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const followerId = req.user!.id
      const result = await this.profileService.isFollowing(followerId, req.params.profileId)
      res.status(200).json({ success: true, data: { isFollowing: result } })
    } catch (err) {
      next(err)
    }
  }

  getFollowers = async (
    req: Request<{ profileId: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1)
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50))
      const result = await this.profileService.getFollowers(req.params.profileId, page, limit)
      res.status(200).json({
        success: true,
        data: { ...result, page, limit },
        message: "Followers retrieved successfully",
      })
    } catch (err) {
      next(err)
    }
  }

  getFollowing = async (
    req: Request<{ profileId: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1)
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50))
      const result = await this.profileService.getFollowing(req.params.profileId, page, limit)
      res.status(200).json({
        success: true,
        data: { ...result, page, limit },
        message: "Following retrieved successfully",
      })
    } catch (err) {
      next(err)
    }
  }
}

export default ProfileController
