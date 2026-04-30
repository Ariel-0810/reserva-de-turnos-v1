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
  return (session?.user as any)?.businessId ?? null;
}

async function loadBlockOwnedBy(id: string, businessId: string) {
  const block = await RecurringBlock.findByPk(id);
  if (!block || block.businessId !== businessId) return null;
  return block;
}

async function revalidateBookingPath(businessId: string) {
  const business = await Business.findByPk(businessId);
  if (business?.slug) {
    try {
      revalidatePath(`/booking/${business.slug}`);
    } catch {
      // no-op
    }
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = await getOwnedBusinessId();
    if (!businessId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    await initDb();

    const block = await loadBlockOwnedBy(params.id, businessId);
    if (!block) return NextResponse.json({ error: "Bloque no encontrado" }, { status: 404 });

    const body = await request.json();
    const {
      serviceId,
      dayOfWeek,
      startTime,
      endTime,
      label,
      startDate,
      endDate,
      isActive,
    } = body ?? {};

    // Resolver valores nuevos (si no vienen, mantener existentes)
    const next = {
      serviceId: serviceId !== undefined ? (serviceId ?? null) : block.serviceId,
      dayOfWeek: dayOfWeek !== undefined ? dayOfWeek : block.dayOfWeek,
      startTime: startTime ?? block.startTime,
      endTime: endTime ?? block.endTime,
      label: label !== undefined ? (label ?? null) : block.label,
      startDate: startDate !== undefined ? (startDate ?? null) : block.startDate,
      endDate: endDate !== undefined ? (endDate ?? null) : block.endDate,
      isActive: isActive !== undefined ? !!isActive : block.isActive,
    };

    // Validaciones
    if (typeof next.dayOfWeek !== "number" || next.dayOfWeek < 0 || next.dayOfWeek > 6) {
      return NextResponse.json(
        { error: "dayOfWeek debe estar entre 0 y 6" },
        { status: 400 }
      );
    }
    if (next.startTime >= next.endTime) {
      return NextResponse.json(
        { error: "La hora de inicio debe ser menor a la de fin" },
        { status: 400 }
      );
    }

    // Solape con otros bloques del mismo serviceId (excluyendo este)
    if (next.isActive) {
      const overlap = await RecurringBlock.findOne({
        where: {
          businessId,
          dayOfWeek: next.dayOfWeek,
          isActive: true,
          serviceId: next.serviceId,
          startTime: { [Op.lt]: next.endTime },
          endTime: { [Op.gt]: next.startTime },
          id: { [Op.ne]: block.id },
        },
      });
      if (overlap) {
        return NextResponse.json(
          { error: "Ya existe un bloque solapado para este servicio en ese horario" },
          { status: 400 }
        );
      }
    }

    // Conflict warning con bookings futuros
    const conflicts = await Booking.count({
      where: {
        businessId,
        ...(next.serviceId ? { serviceId: next.serviceId } : {}),
        status: { [Op.in]: ["PENDING", "CONFIRMED"] },
        bookingDate: { [Op.gte]: todayISO() },
        startTime: { [Op.lt]: next.endTime },
        endTime: { [Op.gt]: next.startTime },
      },
    });

    await block.update(next);
    await revalidateBookingPath(businessId);

    return NextResponse.json({
      block,
      conflictWarning: conflicts > 0 ? conflicts : null,
    });
  } catch (error) {
    console.error("PUT recurring-block error:", error);
    return NextResponse.json({ error: "Error al actualizar bloque" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = await getOwnedBusinessId();
    if (!businessId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    await initDb();

    const block = await loadBlockOwnedBy(params.id, businessId);
    if (!block) return NextResponse.json({ error: "Bloque no encontrado" }, { status: 404 });

    await block.destroy();
    await revalidateBookingPath(businessId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE recurring-block error:", error);
    return NextResponse.json({ error: "Error al borrar bloque" }, { status: 500 });
  }
}
