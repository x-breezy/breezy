import { DataTypes, Model, type Sequelize } from "sequelize"

export interface TwoFactorCodeAttributes {
  id: string
  userId: string
  code: string
  expiresAt: Date
  usedAt: Date | null
}

export class TwoFactorCode
  extends Model<TwoFactorCodeAttributes, Omit<TwoFactorCodeAttributes, "id">>
  implements TwoFactorCodeAttributes
{
  declare id: string
  declare userId: string
  declare code: string
  declare expiresAt: Date
  declare usedAt: Date | null
}

export function initTwoFactorCodeModel(sequelize: Sequelize): void {
  TwoFactorCode.init(
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
      code: {
        type: DataTypes.STRING(6),
        allowNull: false,
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
      tableName: "two_factor_codes",
      timestamps: false,
      underscored: true,
    }
  )
}
