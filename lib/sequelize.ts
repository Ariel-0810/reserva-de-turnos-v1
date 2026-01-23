import pg from "pg";
import { Sequelize } from "sequelize";

const globalForSequelize = globalThis as unknown as {
  sequelize?: Sequelize;
};

export const sequelize =
  globalForSequelize.sequelize ??
  new Sequelize(process.env.DATABASE_URL!, {
    dialect: "postgres",
    dialectModule: pg,
    logging: false,
    dialectOptions:
      process.env.NODE_ENV === "production"
        ? {
            ssl: { require: true, rejectUnauthorized: false },
          }
        : {},
  });

if (process.env.NODE_ENV !== "production") {
  globalForSequelize.sequelize = sequelize;
}
