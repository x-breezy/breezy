import { CreateUserInput, UpdateUserInput, User } from "../models/user.model"

class UserService {
  async addUser(input: CreateUserInput): Promise<User> {
    return User.create(input)
  }

  async getUser(id: string): Promise<User | null> {
    return User.findByPk(id)
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<User | null> {
    const user = await User.findByPk(id)
    if (!user) return null
    return user.update(input)
  }

  async deleteUser(id: string): Promise<boolean> {
    const deleted = await User.destroy({ where: { id } })
    return deleted > 0
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email } })
  }
}

export default UserService
