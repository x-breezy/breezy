import { DataTypes, Model, Optional, Sequelize } from "sequelize"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FollowAttributes {
  id: string
  followerId: string
  followingId: string
  createdAt: Date
}

export type CreateFollowInput = Optional<FollowAttributes, "id" | "createdAt">

// ─── Model ────────────────────────────────────────────────────────────────────

export class Follow extends Model<FollowAttributes, CreateFollowInput> implements FollowAttributes {
  declare id: string
  declare followerId: string
  declare followingId: string
  declare readonly createdAt: Date
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initFollowModel(sequelize: Sequelize): void {
  Follow.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      followerId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "follower_id",
      },
      followingId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "following_id",
      },
      createdAt: {
        type: DataTypes.DATE,
        field: "created_at",
      },
    },
    {
      sequelize,
      tableName: "follows",
      timestamps: true,
      updatedAt: false, // un follow n'est jamais modifié
      underscored: false,
      indexes: [
        { unique: true, fields: ["follower_id", "following_id"] }, // empêche le double follow
        { fields: ["follower_id"] },
        { fields: ["following_id"] },
      ],
    }
  )
}
