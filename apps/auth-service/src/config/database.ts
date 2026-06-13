import { Sequelize } from "sequelize"

let sequelize: Sequelize | null = null

/** Return the active Sequelize instance. Throws if connect() has not run yet. */
export function getSequelize(): Sequelize {
  if (!sequelize) throw new Error("Database not initialized, call connect() first")
  return sequelize
}

/** Open the shared Sequelize (PostgreSQL) connection. Idempotent. */
export async function connect(uri: string): Promise<Sequelize> {
  if (sequelize) return sequelize
  sequelize = new Sequelize(uri, {
    dialect: "postgres",
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  })
  await sequelize.authenticate()
  return sequelize
}

/** Close the shared connection. */
export async function disconnect(): Promise<void> {
  if (!sequelize) return
  await sequelize.close()
  sequelize = null
}
