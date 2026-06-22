import { DataTypes, Model, type Sequelize } from "sequelize"
import { ROLES, type Role } from "../constants/roles"

export interface UserAttributes {
  id: string
  username: string
  email: string
  passwordHash: string | null
  googleId: string | null
  role: Role
  isBanned: boolean
  isEmailVerified: boolean
  twoFactorEnabled: boolean
  createdAt: Date
  updatedAt: Date
}

export type CreateUserInput = {
  username: string
  email: string
  passwordHash?: string | null
  googleId?: string | null
  isEmailVerified?: boolean
}

/** User without the password hash, safe to serialize to clients/tokens. */
export type SafeUser = Omit<UserAttributes, "passwordHash">

export class User extends Model<UserAttributes, CreateUserInput> implements UserAttributes {
  declare id: string
  declare username: string
  declare email: string
  declare passwordHash: string | null
  declare googleId: string | null
  declare role: Role
  declare isBanned: boolean
  declare isEmailVerified: boolean
  declare twoFactorEnabled: boolean
  declare readonly createdAt: Date
  declare readonly updatedAt: Date

  toJSON(): SafeUser {
    const values = { ...(super.toJSON() as UserAttributes) } as Partial<UserAttributes>
    delete values.passwordHash
    return values as SafeUser
  }
}

export function initUserModel(sequelize: Sequelize): void {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          len: [3, 50],
          notEmpty: true,
        },
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      googleId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: ROLES.USER,
      },
      isBanned: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isEmailVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      twoFactorEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // Values auto-managed by `timestamps: true`; listed only to satisfy the typed attributes.
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: "users",
      timestamps: true,
      underscored: true,
      indexes: [
        { unique: true, fields: ["username"] },
        { unique: true, fields: ["email"] },
        { unique: true, fields: ["google_id"] },
      ],
    }
  )
}
