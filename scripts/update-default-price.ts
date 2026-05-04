import { Subscription, SystemConfig, sequelize } from "../lib/db";

const NEW_PRICE = "20000";
const OLD_PRICE_NUM = 5000;

async function main() {
  console.log("🚀 Actualizando precio default del plan a 20.000 ARS");

  await sequelize.authenticate();
  console.log("✅ Conexión a DB OK");

  // 1) Actualizar SystemConfig.plan.defaultPrice
  const cfg = await SystemConfig.findOne({ where: { key: "plan.defaultPrice" } });
  if (cfg) {
    await cfg.update({ value: NEW_PRICE });
    console.log(`✅ SystemConfig 'plan.defaultPrice' = ${NEW_PRICE}`);
  } else {
    await SystemConfig.create({ key: "plan.defaultPrice", value: NEW_PRICE });
    console.log(`✅ SystemConfig 'plan.defaultPrice' creado en ${NEW_PRICE}`);
  }

  // 2) Actualizar Subscriptions con el precio viejo (5000)
  const [updated] = await Subscription.update(
    { monthlyPrice: parseFloat(NEW_PRICE) },
    { where: { monthlyPrice: OLD_PRICE_NUM } }
  );
  console.log(`✅ ${updated} Subscriptions actualizadas (de ${OLD_PRICE_NUM} → ${NEW_PRICE})`);

  console.log("🎉 Listo");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
