export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Op } from "sequelize";
import { initDb } from "@/lib/db";

import { Booking } from "@/lib/models/Booking";
import { Service } from "@/lib/models/Service";
import { Business } from "@/lib/models/Business";

// GET: Search booking by uniqueId
export async function GET(request: Request) {
  try {
    await initDb();

    const { searchParams } = new URL(request.url);
    const uniqueId = searchParams.get("uniqueId");
    const slug = searchParams.get("slug");

    if (!uniqueId || !slug) {
      return NextResponse.json(
        { error: "UniqueId y slug requeridos" },
        { status: 400 }
      );
    }

    // Find business by slug
    const business = await Business.findOne({
      where: { slug },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    // Find booking by uniqueId and businessId
    const booking = await Booking.findOne({
      where: {
        uniqueId: uniqueId.trim(),
        businessId: business.id,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    // Manually fetch service
    const service = await Service.findByPk(booking.serviceId);

    return NextResponse.json({
      uniqueId: booking.uniqueId,
      status: booking.status,
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerEmail: booking.customerEmail,
      service: service ? {
        id: service.id,
        name: service.name,
        durationMinutes: service.durationMinutes,
        price: service.price?.toString() ?? "0",
      } : null,
    });
  } catch (error) {
    console.error("GET search booking error:", error);
    return NextResponse.json(
      { error: "Error al buscar reserva" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await initDb();

    const body = await request.json();
    const { slug, date } = body ?? {};

    if (!slug || !date) {
      return NextResponse.json(
        { error: "Slug y fecha requeridos" },
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
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    // =====================
    // BUSCAR RESERVAS
    // =====================
    const bookings = await Booking.findAll({
      where: {
        businessId: business.id,
        bookingDate: date,
        status: {
          [Op.in]: ["PENDING", "CONFIRMED"],
        },
      },
      order: [["startTime", "ASC"]],
    });

    // =====================
    // RESPONSE LIMPIA con queries manuales
    // =====================
    const response = await Promise.all(
      bookings.map(async (booking) => {
        // Manually fetch service
        const service = await Service.findByPk(booking.serviceId);
        
        return {
          id: booking.id,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
          service: service
            ? {
                id: service.id,
                name: service.name,
                durationMinutes: service.durationMinutes,
                price: service.price?.toString() ?? "0",
              }
            : null,
        };
      })
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Search booking error:", error);
    return NextResponse.json(
      { error: "Error al buscar reservas" },
      { status: 500 }
    );
  }
}
