export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import {
  Business, Booking, BusinessHours, Service,
  Subscription, Payment, RecurringBlock, User,
  sequelize,
} from "@/lib/db";

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id ?? null;
    const businessId = (session?.user as any)?.businessId ?? null;
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await sequelize.transaction(async (t) => {
      if (businessId) {
        await Payment.destroy({ where: { businessId }, transaction: t });
        await Subscription.destroy({ where: { businessId }, transaction: t });
        await RecurringBlock.destroy({ where: { businessId }, transaction: t });
        await Booking.destroy({ where: { businessId }, transaction: t });
        await BusinessHours.destroy({ where: { businessId }, transaction: t });
        await Service.destroy({ where: { businessId }, transaction: t });
        await Business.destroy({ where: { id: businessId }, transaction: t });
      }
      await User.destroy({ where: { id: userId }, transaction: t });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE business account error:", error);
    return NextResponse.json({ error: "Error al eliminar cuenta" }, { status: 500 });
  }
}
