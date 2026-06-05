import { DataTypes, Model, Optional, Sequelize } from "sequelize"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserAttributes {
  id: string
  username: string
  email: string
  passwordHash: string
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export type CreateUserInput = Optional<
  UserAttributes,
  "id" | "isVerified" | "createdAt" | "updatedAt"
>

export type UpdateUserInput = Partial<
  Pick<UserAttributes, "username" | "passwordHash" | "isVerified">
>

export type SafeUser = Omit<UserAttributes, "passwordHash">

// ─── Model ────────────────────────────────────────────────────────────────────

export class User extends Model<UserAttributes, CreateUserInput> implements UserAttributes {
  declare id: string
  declare username: string
  declare email: string
  declare passwordHash: string
  declare isVerified: boolean
  declare readonly createdAt: Date
  declare readonly updatedAt: Date

  toJSON(): SafeUser {
    const { passwordHash, ...safe } = super.toJSON() as UserAttributes
    return safe
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

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
        allowNull: false,
        field: "password_hash",
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "is_verified",
      },
      createdAt: {
        type: DataTypes.DATE,
        field: "created_at",
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: "updated_at",
      },
    },
    {
      sequelize,
      tableName: "users",
      timestamps: true,
      underscored: false,
      indexes: [
        { unique: true, fields: ["username"] },
        { unique: true, fields: ["email"] },
      ],
    }
  )
}
