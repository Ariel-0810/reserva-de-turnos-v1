import { RecurringBlock, sequelize } from "../lib/db";

async function main() {
  console.log("🚀 Migración: RecurringBlock");

  await sequelize.authenticate();
  console.log("✅ Conexión a DB OK");

  await RecurringBlock.sync();
  console.log("✅ Tabla RecurringBlock creada (o ya existía)");

  console.log("🎉 Migración completada");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error en migración:", err);
  process.exit(1);
});
