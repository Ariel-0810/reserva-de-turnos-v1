export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { initDb } from "@/lib/db";
import { Subscription } from "@/lib/models/Subscription";

async function getOwnedBusinessId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.businessId ?? null;
}

export async function GET() {
  try {
    const businessId = await getOwnedBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await initDb();

    const sub = await Subscription.findOne({ where: { businessId } });
    if (!sub) {
      return NextResponse.json({ subscription: null });
    }

    return NextResponse.json({
      subscription: {
        id: sub.id,
        status: sub.status,
        monthlyPrice: sub.monthlyPrice,
        trialEndsAt: sub.trialEndsAt,
        paidUntil: sub.paidUntil,
        lastPaymentAt: sub.lastPaymentAt,
      },
    });
  } catch (error) {
    console.error("GET business subscription error:", error);
    return NextResponse.json({ error: "Error al obtener suscripción" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const businessId = await getOwnedBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await initDb();

    const body = await request.json();
    const action = body?.action as "cancel" | "reactivate" | undefined;

    const sub = await Subscription.findOne({ where: { businessId } });
    if (!sub) {
      return NextResponse.json({ error: "Suscripción no encontrada" }, { status: 404 });
    }

    if (action === "cancel") {
      // Razón opcional para feedback loop de churn.
      const validReasons = ["PRICE", "NOT_USED", "FOUND_BETTER", "OTHER"];
      const rawReason = body?.reason;
      const reason = validReasons.includes(rawReason) ? rawReason : null;
      const reasonText = typeof body?.reasonText === "string" && body.reasonText.trim() !== ""
        ? body.reasonText.trim().slice(0, 1000)
        : null;

      await sub.update({
        status: "CANCELLED",
        cancelReason: reason,
        cancelReasonText: reasonText,
      });
      return NextResponse.json({
        success: true,
        message:
          sub.paidUntil
            ? `Suscripción cancelada. Podés seguir usando el servicio hasta ${new Date(sub.paidUntil).toLocaleDateString("es-AR")}.`
            : "Suscripción cancelada.",
      });
    }

    if (action === "reactivate") {
      // Reactivar suscripción cancelada: vuelve a TRIAL si nunca pagó, ACTIVE si tenía paidUntil futuro,
      // PAST_DUE si paidUntil ya pasó.
      const now = new Date();
      let nextStatus: "TRIAL" | "ACTIVE" | "PAST_DUE" = "TRIAL";
      if (sub.paidUntil) {
        nextStatus = new Date(sub.paidUntil) >= now ? "ACTIVE" : "PAST_DUE";
      } else if (sub.trialEndsAt && new Date(sub.trialEndsAt) >= now) {
        nextStatus = "TRIAL";
      } else {
        nextStatus = "PAST_DUE";
      }
      await sub.update({
        status: nextStatus,
        cancelReason: null,
        cancelReasonText: null,
      });
      return NextResponse.json({ success: true, status: nextStatus });
    }

    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  } catch (error) {
    console.error("POST business subscription error:", error);
    return NextResponse.json({ error: "Error al procesar solicitud" }, { status: 500 });
  }
}
