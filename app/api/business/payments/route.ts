export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { Payment, initDb } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const businessId = (session?.user as any)?.businessId ?? null;
    if (!businessId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await initDb();

    const payments = await Payment.findAll({
      where: { businessId },
      order: [["paidAt", "DESC"]],
    });

    return NextResponse.json({
      payments: payments.map((p) => p.get({ plain: true })),
    });
  } catch (error) {
    console.error("GET business payments error:", error);
    return NextResponse.json({ error: "Error al obtener pagos" }, { status: 500 });
  }
}
