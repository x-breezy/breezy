import { DataTypes, Model, type Sequelize } from "sequelize"

export interface RefreshTokenAttributes {
  id: string
  userId: string
  tokenHash: string
  expiresAt: Date
  revokedAt: Date | null
  replacedBy: string | null
}

export class RefreshToken
  extends Model<RefreshTokenAttributes, Omit<RefreshTokenAttributes, "id">>
  implements RefreshTokenAttributes
{
  declare id: string
  declare userId: string
  declare tokenHash: string
  declare expiresAt: Date
  declare revokedAt: Date | null
  declare replacedBy: string | null
}

export function initRefreshTokenModel(sequelize: Sequelize): void {
  RefreshToken.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      tokenHash: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      revokedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      replacedBy: {
        type: DataTypes.STRING(64),
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      sequelize,
      tableName: "refresh_tokens",
      timestamps: false,
      underscored: true,
      indexes: [{ unique: true, fields: ["token_hash"] }, { fields: ["user_id"] }],
    }
  )
}
