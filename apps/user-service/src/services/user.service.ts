import { User } from "@breezy/db"
import type { CreateUserInput, UpdateUserInput } from "@breezy/db"

class UserService {
  async addUser(input: CreateUserInput): Promise<User> {
    return User.create(input)
  }

  async getUser(id: string): Promise<User | null> {
    return User.findByPk(id, {
      attributes: { exclude: ["passwordHash"] },
    })
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<User | null> {
    const user = await User.findByPk(id)

    if (!user) return null

    await user.update(input)

    const { passwordHash, ...rest } = user.toJSON()
    return rest as unknown as User
  }

  async deleteUser(id: string): Promise<boolean> {
    const deleted = await User.destroy({ where: { id } })
    return deleted > 0
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return User.findOne({
      where: { email },
      attributes: { exclude: ["passwordHash"] },
    })
  }
}

export default UserService