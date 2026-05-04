import { sequelize } from "../lib/db";

async function main() {
  console.log("🚀 Migración: Subscription.cancelReason + cancelReasonText");

  await sequelize.authenticate();
  console.log("✅ Conexión a DB OK");

  await sequelize.query(`
    ALTER TABLE "Subscription"
    ADD COLUMN IF NOT EXISTS "cancelReason" VARCHAR(20),
    ADD COLUMN IF NOT EXISTS "cancelReasonText" TEXT
  `);
  console.log('✅ Columnas "cancelReason" y "cancelReasonText" creadas (o ya existían)');

  console.log("🎉 Migración completada");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error en migración:", err);
  process.exit(1);
});
