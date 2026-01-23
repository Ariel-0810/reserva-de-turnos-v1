export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Op } from "sequelize";
import { initDb } from "@/lib/db";

import { Booking } from "@/lib/models/Booking";
import { Service } from "@/lib/models/Service";
import { Business } from "@/lib/models/Business";
import { User } from "@/lib/models/User";

import {
  sendEmail,
  bookingCancelledByCustomerEmailToOwner,
} from "@/lib/email";

import { formatDate } from "@/lib/utils";

export async function PUT(request: Request) {
  try {
    await initDb();

    const body = await request.json();
    const { uniqueId, slug } = body ?? {};

    if (!uniqueId || !slug) {
      return NextResponse.json(
        { error: "ID y slug requeridos" },
        { status: 400 }
      );
    }

    // =====================
    // NEGOCIO
    // =====================
    const business = await Business.findOne({
      where: { slug },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Reserva no encontrada o ya cancelada" },
        { status: 404 }
      );
    }

    // Manually fetch user/owner
    const owner = await User.findByPk(business.userId);
    if (!owner) {
      return NextResponse.json(
        { error: "Dueño del negocio no encontrado" },
        { status: 404 }
      );
    }

    // =====================
    // RESERVA
    // =====================
    const booking = await Booking.findOne({
      where: {
        uniqueId: uniqueId.toUpperCase(),
        businessId: business.id,
        status: { [Op.in]: ["PENDING", "CONFIRMED"] },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Reserva no encontrada o ya cancelada" },
        { status: 404 }
      );
    }

    // Manually fetch service
    const service = await Service.findByPk(booking.serviceId);

    await booking.update({ status: "CANCELLED" });

    // =====================
    // EMAIL AL DUEÑO
    // =====================
    await sendEmail({
      to: owner.email,
      subject: `❌ Reserva cancelada por cliente - ${service?.name ?? ""} - ${booking.uniqueId}`,
      html: bookingCancelledByCustomerEmailToOwner({
        businessName: business.name,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerEmail: booking.customerEmail,
        serviceName: service?.name ?? "",
        bookingDate: formatDate(new Date(booking.bookingDate)),
        startTime: booking.startTime,
        endTime: booking.endTime,
        uniqueId: booking.uniqueId,
      }),
    });

    return NextResponse.json({
      success: true,
      message: "Reserva cancelada exitosamente",
    });
  } catch (error) {
    console.error("PUT cancel booking error:", error);
    return NextResponse.json(
      { error: "Error al cancelar reserva" },
      { status: 500 }
    );
  }
}
