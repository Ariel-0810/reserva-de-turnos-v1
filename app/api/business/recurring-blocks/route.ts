export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { revalidatePath } from "next/cache";
import { Op } from "sequelize";
import { initDb } from "@/lib/db";
import { RecurringBlock } from "@/lib/models/RecurringBlock";
import { Booking } from "@/lib/models/Booking";
import { Business } from "@/lib/models/Business";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

async function getOwnedBusinessId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const businessId = (session?.user as any)?.businessId ?? null;
  return businessId;
}

export async function GET() {
  try {
    const businessId = await getOwnedBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await initDb();

    const blocks = await RecurringBlock.findAll({
      where: { businessId },
      order: [
        ["dayOfWeek", "ASC"],
        ["startTime", "ASC"],
      ],
    });

    return NextResponse.json({ blocks });
  } catch (error) {
    console.error("GET recurring-blocks error:", error);
    return NextResponse.json({ error: "Error al obtener bloques" }, { status: 500 });
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
    const {
      serviceId,
      dayOfWeek,
      startTime,
      endTime,
      label,
      startDate,
      endDate,
    } = body ?? {};

    // ---- Validaciones ----
    if (
      dayOfWeek === undefined ||
      dayOfWeek === null ||
      !startTime ||
      !endTime
    ) {
      return NextResponse.json(
        { error: "Datos incompletos: dayOfWeek, startTime, endTime son requeridos" },
        { status: 400 }
      );
    }
    if (typeof dayOfWeek !== "number" || dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json(
        { error: "dayOfWeek debe estar entre 0 y 6" },
        { status: 400 }
      );
    }
    if (startTime >= endTime) {
      return NextResponse.json(
        { error: "La hora de inicio debe ser menor a la de fin" },
        { status: 400 }
      );
    }

    // ---- Solapamiento con otros bloques del mismo servicio ----
    const overlap = await RecurringBlock.findOne({
      where: {
        businessId,
        dayOfWeek,
        isActive: true,
        // mismo serviceId (incluye null = "todos los servicios")
        serviceId: serviceId ?? null,
        startTime: { [Op.lt]: endTime },
        endTime: { [Op.gt]: startTime },
      },
    });
    if (overlap) {
      return NextResponse.json(
        { error: "Ya existe un bloque solapado para este servicio en ese horario" },
        { status: 400 }
      );
    }

    // ---- Conflict warning con reservas futuras (no bloqueante) ----
    const conflicts = await Booking.count({
      where: {
        businessId,
        ...(serviceId ? { serviceId } : {}),
        status: { [Op.in]: ["PENDING", "CONFIRMED"] },
        bookingDate: { [Op.gte]: todayISO() },
        startTime: { [Op.lt]: endTime },
        endTime: { [Op.gt]: startTime },
      },
    });

    const block = await RecurringBlock.create({
      businessId,
      serviceId: serviceId ?? null,
      dayOfWeek,
      startTime,
      endTime,
      label: label ?? null,
      startDate: startDate ?? null,
      endDate: endDate ?? null,
      isActive: true,
    });

    // ---- Invalidar cache del booking público ----
    const business = await Business.findByPk(businessId);
    if (business?.slug) {
      try {
        revalidatePath(`/booking/${business.slug}`);
      } catch {
        // no-op si revalidate falla
      }
    }

    return NextResponse.json({
      block,
      conflictWarning: conflicts > 0 ? conflicts : null,
    });
  } catch (error) {
    console.error("POST recurring-blocks error:", error);
    return NextResponse.json({ error: "Error al crear bloque" }, { status: 500 });
  }
}
