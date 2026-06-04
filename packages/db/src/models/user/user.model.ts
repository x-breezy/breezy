import { DataTypes, Model, Optional, Sequelize } from "sequelize"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserAttributes {
  id: string
  username: string
  email: string
  passwordHash: string
  isVerified: boolean
  mediaId: string | null
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type CreateUserInput = Optional<
  UserAttributes,
  "id" | "isVerified" | "mediaId" | "lastLoginAt" | "createdAt" | "updatedAt"
>

export type UpdateUserInput = Partial<Pick<UserAttributes, "username" | "mediaId" | "isVerified" | "lastLoginAt">>

export type SafeUser = Omit<UserAttributes, "passwordHash">

// ─── Model ────────────────────────────────────────────────────────────────────

export class User extends Model<UserAttributes, CreateUserInput> implements UserAttributes {
  declare id: string
  declare username: string
  declare email: string
  declare passwordHash: string
  declare isVerified: boolean
  declare mediaId: string | null
  declare lastLoginAt: Date | null
  declare readonly createdAt: Date
  declare readonly updatedAt: Date

  /**
   * Strips passwordHash from any serialization (toJSON, res.json, etc.)
   * Prevents accidental leaking of sensitive fields in API responses.
   */
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
        field: "username",
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
        field: "email",
      },
      passwordHash: {
        type: DataTypes.STRING(255), // bcrypt output is 60 chars; 255 gives headroom for future algorithms
        allowNull: false,
        field: "password_hash",
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "is_verified",
      },
      mediaId: {
        type: DataTypes.UUID,
        allowNull: true,
        defaultValue: null,
        references: { model: "media", key: "id" },
        onDelete: "SET NULL",
        field: "media_id",
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
        field: "last_login_at",
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
      underscored: false, // explicit field mappings above; no implicit transformation
      indexes: [{ unique: true, fields: ["username"] }, { unique: true, fields: ["email"] }, { fields: ["media_id"] }],
    }
  )
}
