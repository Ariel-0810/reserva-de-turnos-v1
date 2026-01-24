import pg from "pg";
import { Sequelize } from "sequelize";

const globalForSequelize = globalThis as unknown as {
  sequelize?: Sequelize;
};

// Función helper para obtener o crear la instancia de Sequelize
function getSequelizeInstance(): Sequelize {
  if (globalForSequelize.sequelize) {
    return globalForSequelize.sequelize;
  }

  // Validar que DATABASE_URL esté definida
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl || databaseUrl.trim() === '') {
    throw new Error(
      'DATABASE_URL no está definida. Por favor, configura esta variable de entorno en Vercel.'
    );
  }

  const instance = new Sequelize(databaseUrl, {
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
    globalForSequelize.sequelize = instance;
  }

  return instance;
}

// Crear una instancia lazy usando un Proxy
export const sequelize = new Proxy({} as Sequelize, {
  get(_target, prop) {
    const instance = getSequelizeInstance();
    const value = instance[prop as keyof Sequelize];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});
