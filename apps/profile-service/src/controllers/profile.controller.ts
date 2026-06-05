import { Request, Response } from "express"
import ProfileService from "../services/profile.service"
import { CreateProfileInput, UpdateProfileInput } from "../models/profile.model"

interface AuthenticatedRequest extends Request {
  profile?: { id: string }
}

class ProfileController {
  private profileService: ProfileService

  constructor(profileService: ProfileService) {
    this.profileService = profileService
  }

  async createProfile(req: Request, res: Response): Promise<void> {
    try {
      const input: CreateProfileInput = req.body
      const profile = await this.profileService.createProfile(input)
      res.status(201).json({ message: "Profile created successfully", data: profile })
    } catch (error) {
      res.status(500).json({
        message: "Failed to create profile",
        ...(process.env.NODE_ENV !== "production" && { error: (error as Error).message }),
      })
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const profileId = req.params.profileId as string
      if (!profileId) {
        res.status(400).json({ message: "profileId is required" })
        return
      }

      const profile = await this.profileService.getProfile(profileId)

      if (!profile) {
        res.status(404).json({ message: "Profile not found" })
        return
      }

      res.status(200).json({ message: "Profile retrieved successfully", data: profile })
    } catch (error) {
      res.status(500).json({
        message: "Failed to retrieve profile",
        ...(process.env.NODE_ENV !== "production" && { error: (error as Error).message }),
      })
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const profileId = req.profile?.id
      if (!profileId) {
        res.status(401).json({ message: "Unauthorized" })
        return
      }

      const input: UpdateProfileInput = req.body
      const updated = await this.profileService.updateProfile(profileId, input)

      if (!updated) {
        res.status(404).json({ message: "Profile not found" })
        return
      }

      res.status(200).json({ message: "Profile updated successfully", data: updated })
    } catch (error) {
      res.status(500).json({
        message: "Failed to update profile",
        ...(process.env.NODE_ENV !== "production" && { error: (error as Error).message }),
      })
    }
  }

  async deleteProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const profileId = req.profile?.id
      if (!profileId) {
        res.status(401).json({ message: "Unauthorized" })
        return
      }

      const deleted = await this.profileService.deleteProfile(profileId)

      if (!deleted) {
        res.status(404).json({ message: "Profile not found" })
        return
      }

      res.status(204).send()
    } catch (error) {
      res.status(500).json({
        message: "Failed to delete profile",
        ...(process.env.NODE_ENV !== "production" && { error: (error as Error).message }),
      })
    }
  }

  async follow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const followerId = req.profile?.id
      if (!followerId) {
        res.status(401).json({ message: "Unauthorized" })
        return
      }

      const { followingId } = req.body

      if (followerId === followingId) {
        res.status(400).json({ message: "Cannot follow yourself" })
        return
      }

      await this.profileService.follow(followerId, followingId)
      res.status(201).json({ message: "Followed successfully" })
    } catch (error) {
      res.status(500).json({
        message: "Failed to follow profile",
        ...(process.env.NODE_ENV !== "production" && { error: (error as Error).message }),
      })
    }
  }

  async unfollow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const followerId = req.profile?.id
      if (!followerId) {
        res.status(401).json({ message: "Unauthorized" })
        return
      }

      const { followingId } = req.body
      const unfollowed = await this.profileService.unfollow(followerId, followingId)

      if (!unfollowed) {
        res.status(404).json({ message: "Follow relation not found" })
        return
      }

      res.status(200).json({ message: "Unfollowed successfully" })
    } catch (error) {
      res.status(500).json({
        message: "Failed to unfollow profile",
        ...(process.env.NODE_ENV !== "production" && { error: (error as Error).message }),
      })
    }
  }

  async getRelations(req: Request, res: Response): Promise<void> {
    try {
      const profileId = req.params.profileId as string
      if (!profileId) {
        res.status(400).json({ message: "profileId is required" })
        return
      }

      const relations = await this.profileService.getRelations(profileId)
      res.status(200).json({ message: "Relations retrieved successfully", data: relations })
    } catch (error) {
      res.status(500).json({
        message: "Failed to retrieve relations",
        ...(process.env.NODE_ENV !== "production" && { error: (error as Error).message }),
      })
    }
  }
}

export default ProfileController
