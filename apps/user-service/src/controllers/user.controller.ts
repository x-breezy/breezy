import { Request, Response } from "express"
import { CreateUserInput, UpdateUserInput } from "../models/user.model"
import UserService from "../services/user.service"

class UserController {
  private userService: UserService

  constructor(userService: UserService) {
    this.userService = userService
  }

  async addUser(req: Request, res: Response): Promise<void> {
    try {
      const input: CreateUserInput = req.body
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
    try {
      const { id } = req.params

      if (!id) {
        res.status(400).json({ message: "ID is required" })
        return
      }

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

      if (!id) {
        res.status(400).json({ message: "ID is required" })
        return
      }

      const input: UpdateUserInput = req.body
      const updated = await this.userService.updateUser(id, input)

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
      const { email } = req.query

      if (!email || typeof email !== "string") {
        res.status(400).json({ message: "Email query parameter is required" })
        return
      }

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

      if (!id) {
        res.status(400).json({ message: "ID is required" })
        return
      }

      const deleted = await this.userService.deleteUser(id)

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

export default UserController
