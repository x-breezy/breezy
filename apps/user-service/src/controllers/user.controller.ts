import { Request, Response } from "express"
import UserService from "../services/user.service"

class userController {
  private userService: UserService

  constructor(userService: UserService) {
    this.userService = userService
  }

  async addUser(req: Request, res: Response): Promise<void> {
    try {
      const input: CreateUserInput = req.body // Fix: was `const id = req.body`
      const user = await this.userService.addUser(input)
      res.status(201).json({
        message: "User added successfully",
        data: user,
      })
    } catch (error) {
      res.status(500).json({
        message: "Failed to add user",
        error: (error as Error).message,
      })
    }
  }

  async getUser(req: Request, res: Response): Promise<void> {
    // Fix: was missing
    try {
      const { id } = req.params
      const user = await this.userService.getUser(id)

      if (!user) {
        res.status(404).json({ message: "User not found" })
        return
      }

      res.status(200).json({ message: "User retrieved successfully", data: user })
    } catch (error) {
      res.status(500).json({
        message: "Failed to retrieve user",
        error: (error as Error).message,
      })
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const updated = await this.userService.updateUser(id, req.body)

      if (!updated) {
        res.status(404).json({ message: "User not found" })
        return
      }

      res.status(200).json({ message: "User updated successfully", data: updated })
    } catch (error) {
      res.status(500).json({
        message: "Failed to update user",
        error: (error as Error).message,
      })
    }
  }

  async getUserByEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.params
      const user = await this.userService.getUserByEmail(email)

      if (!user) {
        res.status(404).json({ message: "User not found" })
        return
      }

      res.status(200).json({ message: "User retrieved successfully", data: user })
    } catch (error) {
      res.status(500).json({
        message: "Failed to retrieve user",
        error: (error as Error).message,
      })
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const deleted = await this.userService.deleteUser(id) // Fix: was missing `const deleted =`

      if (!deleted) {
        res.status(404).json({ message: "User not found" })
        return
      }

      res.status(204).send()
    } catch (error) {
      res.status(500).json({
        message: "Failed to delete user",
        error: (error as Error).message,
      })
    }
  }
}

export default userController
