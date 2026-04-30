import { sequelize } from "./sequelize";
import { Op, Model } from "sequelize";

// Import models directly
import { User } from "./models/User";
import { Business } from "./models/Business";
import { Service } from "./models/Service";
import { Booking } from "./models/Booking";
import { BusinessHours } from "./models/BusinessHours";
import { Account } from "./models/Account";
import { Session } from "./models/Session";
import { EmailVerification } from "./models/EmailVerification";
import { SystemConfig } from "./models/SystemConfig";
import { Subscription } from "./models/Subscription";
import { Payment } from "./models/Payment";
import { RecurringBlock } from "./models/RecurringBlock";

// Export everything
export { sequelize };
export { Op };
export { User, Business, Service, Booking, BusinessHours, Account, Session, EmailVerification, SystemConfig, Subscription, Payment, RecurringBlock };

let initialized = false;

// NOTE: NO configuramos asociaciones aquí debido a un bug de Webpack/Next.js
// que crea múltiples instancias de los modelos.
// En su lugar, usa queries manuales con foreign keys cuando necesites joins.

export async function initDb() {
  if (initialized) return;

  console.log('🚀 Inicializando base de datos...');
  console.log('⚠️  NOTA: Asociaciones Sequelize deshabilitadas debido a incompatibilidad con Webpack');
  console.log('   Usa queries manuales con WHERE para joins');

  // Just authenticate
  await sequelize.authenticate();
  console.log('✅ Conexión a base de datos establecida');

  initialized = true;
}