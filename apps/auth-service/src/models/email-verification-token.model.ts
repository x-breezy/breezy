import { DataTypes, Model, type Sequelize } from "sequelize"

export interface EmailVerificationTokenAttributes {
  id: string
  userId: string
  token: string
  expiresAt: Date
  usedAt: Date | null
}

export class EmailVerificationToken
  extends Model<EmailVerificationTokenAttributes, Omit<EmailVerificationTokenAttributes, "id">>
  implements EmailVerificationTokenAttributes
{
  declare id: string
  declare userId: string
  declare token: string
  declare expiresAt: Date
  declare usedAt: Date | null
}

export function initEmailVerificationTokenModel(sequelize: Sequelize): void {
  EmailVerificationToken.init(
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
      tableName: "email_verification_tokens",
      timestamps: false,
      underscored: true,
    }
  )
}
