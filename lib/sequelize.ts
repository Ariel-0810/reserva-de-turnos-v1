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
    pool: {
      max: 5,        // Máximo de conexiones (importante en Vercel)
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: process.env.NODE_ENV === "production"
        ? { require: true, rejectUnauthorized: false }
        : undefined,
      connectionTimeoutMillis: 10000,  // Timeout de conexión
      statement_timeout: 5000,          // Timeout de queries
    },
  });

  // ✅ Cachear instancia también en producción para reutilizar conexiones
  globalForSequelize.sequelize = instance;

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
