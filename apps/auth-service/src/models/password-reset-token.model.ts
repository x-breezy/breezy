import { DataTypes, Model, type Sequelize } from "sequelize"

export interface PasswordResetTokenAttributes {
  id: string
  userId: string
  token: string
  expiresAt: Date
  usedAt: Date | null
}

export class PasswordResetToken
  extends Model<PasswordResetTokenAttributes, Omit<PasswordResetTokenAttributes, "id">>
  implements PasswordResetTokenAttributes
{
  declare id: string
  declare userId: string
  declare token: string
  declare expiresAt: Date
  declare usedAt: Date | null
}

export function initPasswordResetTokenModel(sequelize: Sequelize): void {
  PasswordResetToken.init(
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
      token: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      usedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      sequelize,
      tableName: "password_reset_tokens",
      timestamps: false,
      underscored: true,
    }
  )
}
