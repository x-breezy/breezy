import { DataTypes, Model, type Sequelize } from "sequelize"

export type ReportStatus = "pending" | "resolved"

export interface ReportAttributes {
  id: string
  reporterId: string
  reportedUserId: string
  reason: string
  status: ReportStatus
  resolvedById: string | null
  createdAt: Date
  updatedAt: Date
}

export type CreateReportInput = Pick<ReportAttributes, "reporterId" | "reportedUserId" | "reason">

export class Report extends Model<ReportAttributes, CreateReportInput> implements ReportAttributes {
  declare id: string
  declare reporterId: string
  declare reportedUserId: string
  declare reason: string
  declare status: ReportStatus
  declare resolvedById: string | null
  declare readonly createdAt: Date
  declare readonly updatedAt: Date
}

export function initReportModel(sequelize: Sequelize): void {
  Report.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      reporterId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      reportedUserId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("pending", "resolved"),
        allowNull: false,
        defaultValue: "pending",
      },
      resolvedById: {
        type: DataTypes.UUID,
        allowNull: true,
        defaultValue: null,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: "reports",
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ["reporter_id"] },
        { fields: ["reported_user_id"] },
        { fields: ["status"] },
      ],
    }
  )
}
