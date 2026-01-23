export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Op } from "sequelize";
import { initDb } from "@/lib/db";

import { Business } from "@/lib/models/Business";
import { Booking } from "@/lib/models/Booking";
import { Service } from "@/lib/models/Service";
import { BusinessHours } from "@/lib/models/BusinessHours";
import { User } from "@/lib/models/User";

export async function POST(request: Request) {
  try {
    await initDb();

    const body = await request.json();
    const {
      businessId,
      serviceId,
      date,
      startTime,
      customerName,
      customerPhone,
      customerEmail,
    } = body ?? {};

    // Validate required fields
    if (!businessId || !serviceId || !date || !startTime || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    // =====================
    // FETCH BUSINESS
    // =====================
    const business = await Business.findByPk(businessId);
    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    // Fetch owner
    const owner = await User.findByPk(business.userId);

    // =====================
    // FETCH SERVICE
    // =====================
    const service = await Service.findOne({
      where: {
        id: serviceId,
        businessId: business.id,
        isActive: true,
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Servicio no encontrado" },
        { status: 404 }
      );
    }

    // =====================
    // CALCULATE END TIME
    // =====================
    const [startHour, startMin] = startTime.split(":").map(Number);
    const endMinutes = startHour * 60 + startMin + service.durationMinutes;
    const endHour = Math.floor(endMinutes / 60);
    const endMin = endMinutes % 60;
    const endTime = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;

    // =====================
    // CHECK AVAILABILITY
    // =====================
    const existingBooking = await Booking.findOne({
      where: {
        businessId: business.id,
        serviceId: service.id,
        bookingDate: date,
        status: {
          [Op.in]: ["PENDING", "CONFIRMED"],
        },
        [Op.or]: [
          {
            startTime: {
              [Op.lt]: endTime,
            },
            endTime: {
              [Op.gt]: startTime,
            },
          },
        ],
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: "Horario no disponible" },
        { status: 400 }
      );
    }

    // =====================
    // GENERATE UNIQUE ID
    // =====================
    const uniqueId = `${Date.now().toString(36).toUpperCase()}${Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()}`;

    // =====================
    // CREATE BOOKING
    // =====================
    const booking = await Booking.create({
      businessId: business.id,
      serviceId: service.id,
      customerName,
      customerPhone,
      customerEmail: customerEmail || null,
      bookingDate: date,
      startTime,
      endTime,
      status: "PENDING",
      uniqueId,
    });

    // =====================
    // SEND EMAIL NOTIFICATION (optional)
    // =====================
    // TODO: Send email to business owner

    // =====================
    // RETURN CONFIRMATION
    // =====================
    return NextResponse.json({
      booking: {
        uniqueId: booking.uniqueId,
        businessName: business.name,
        serviceName: service.name,
        date: booking.bookingDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        customerName: booking.customerName,
        status: booking.status,
      },
    });
  } catch (error) {
    console.error("Public booking error:", error);
    return NextResponse.json(
      { error: "Error al crear reserva" },
      { status: 500 }
    );
  }
}
