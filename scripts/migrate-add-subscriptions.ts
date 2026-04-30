import { Business, Subscription, Payment, SystemConfig, sequelize } from "../lib/db";

const DEFAULT_PRICE = "5000";
const TRIAL_DAYS = 7;

function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

async function main() {
  console.log("🚀 Migración: Subscription + Payment");

  await sequelize.authenticate();
  console.log("✅ Conexión a DB OK");

  await Subscription.sync();
  console.log("✅ Tabla Subscription creada (o ya existía)");

  await Payment.sync();
  console.log("✅ Tabla Payment creada (o ya existía)");

  const businesses = await Business.findAll({ attributes: ["id", "createdAt"] });
  console.log(`📊 ${businesses.length} businesses encontrados`);

  let seeded = 0;
  for (const biz of businesses) {
    const existing = await Subscription.findOne({ where: { businessId: biz.id } });
    if (existing) continue;

    const baseDate = biz.createdAt ?? new Date();
    await Subscription.create({
      businessId: biz.id,
      status: "TRIAL",
      monthlyPrice: parseFloat(DEFAULT_PRICE),
      trialEndsAt: addDays(baseDate, TRIAL_DAYS),
    });
    seeded++;
  }
  console.log(`✅ ${seeded} Subscriptions TRIAL seedeadas`);

  const [, created] = await SystemConfig.findOrCreate({
    where: { key: "plan.defaultPrice" },
    defaults: { key: "plan.defaultPrice", value: DEFAULT_PRICE },
  });
  console.log(
    created
      ? `✅ SystemConfig 'plan.defaultPrice' = ${DEFAULT_PRICE}`
      : "ℹ️  SystemConfig 'plan.defaultPrice' ya existía (no se sobreescribe)"
  );

  console.log("🎉 Migración completada");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error en migración:", err);
  process.exit(1);
});
