import { DataTypes, Model, Optional, Sequelize } from "sequelize"

export interface ProfileAttributes {
  profileId: string
  username: string
  firstName: string | null
  lastName: string | null
  bio: string | null
  roles: string[]
  avatarId: string | null
  followersCount: number
  followingCount: number
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type CreateProfileInput = Optional<
  ProfileAttributes,
  | "firstName"
  | "lastName"
  | "bio"
  | "roles"
  | "username"
  | "avatarId"
  | "followersCount"
  | "followingCount"
  | "deletedAt"
  | "createdAt"
  | "updatedAt"
>

export type UpdateProfileInput = Partial<
  Pick<ProfileAttributes, "firstName" | "lastName" | "bio" | "avatarId">
>

export class Profile
  extends Model<ProfileAttributes, CreateProfileInput>
  implements ProfileAttributes
{
  declare profileId: string
  declare username: string
  declare roles: string[]
  declare firstName: string | null
  declare lastName: string | null
  declare bio: string | null
  declare avatarId: string | null
  declare followersCount: number
  declare followingCount: number
  declare deletedAt: Date | null
  declare readonly createdAt: Date
  declare readonly updatedAt: Date
}

export function initProfileModel(sequelize: Sequelize): void {
  Profile.init(
    {
      profileId: {
        type: DataTypes.UUID,
        primaryKey: true,
        field: "profile_id",
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      roles: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      firstName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: null,
        field: "first_name",
      },
      lastName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: null,
        field: "last_name",
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      avatarId: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
        field: "avatar_url",
      },
      followersCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: "followers_count",
      },
      followingCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: "following_count",
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
        field: "deleted_at",
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
      tableName: "profiles",
      timestamps: true,
      underscored: false,
      paranoid: true,
      indexes: [{ fields: ["profile_id"] }],
    }
  )
}
