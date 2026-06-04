// db/sequelize.ts
import { Sequelize } from "sequelize"
import { initUserModel } from "../models/user/user.model"

export const sequelize = new Sequelize({
  dialect: "postgres",
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT) ?? 5432,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  logging: false,
})

initUserModel(sequelize)

export default sequelize
