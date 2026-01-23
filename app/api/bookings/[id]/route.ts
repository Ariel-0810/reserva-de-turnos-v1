export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { initDb } from "@/lib/db";

import { Booking } from "@/lib/models/Booking";
import { Service } from "@/lib/models/Service";
import { Business } from "@/lib/models/Business";

import {
  sendEmail,
  bookingConfirmedEmailToCustomer,
  bookingCancelledEmailToCustomer,
} from "@/lib/email";

import { formatDate } from "@/lib/utils";
import {
  sendWhatsAppMessage,
  getBookingConfirmationMessage,
  getBookingCancellationMessage,
  isTwilioConfigured,
} from "@/lib/twilio";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await initDb();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const businessId = (session.user as any).businessId;
    const bookingId = params.id;

    const booking = await Booking.findOne({
      where: { id: bookingId, businessId },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    // Manually fetch service and business
    const service = await Service.findByPk(booking.serviceId);
    const business = await Business.findByPk(booking.businessId);

    const body = await request.json();
    const { status } = body ?? {};

    if (!["CONFIRMED", "CANCELLED"].includes(status)) {
      return NextResponse.json(
        { error: "Estado inválido" },
        { status: 400 }
      );
    }

    await booking.update({ status });

    // =====================
    // EMAIL AL CLIENTE
    // =====================
    if (booking.customerEmail) {
      const emailParams = {
        businessName: business?.name ?? "",
        customerName: booking.customerName,
        serviceName: service?.name ?? "",
        bookingDate: formatDate(new Date(booking.bookingDate)),
        startTime: booking.startTime,
        endTime: booking.endTime,
        uniqueId: booking.uniqueId,
        businessAddress: business?.address,
      };

      if (status === "CONFIRMED") {
        await sendEmail({
          to: booking.customerEmail,
          subject: `Tu reserva ha sido confirmada - ${business?.name ?? ""}`,
          html: bookingConfirmedEmailToCustomer(emailParams),
        });
      }

      if (status === "CANCELLED") {
        await sendEmail({
          to: booking.customerEmail,
          subject: `Tu reserva ha sido cancelada - ${business?.name ?? ""}`,
          html: bookingCancelledEmailToCustomer(emailParams),
        });
      }
    }

    // =====================
    // WHATSAPP AL CLIENTE
    // =====================
    if (booking.customerPhone && isTwilioConfigured()) {
      const formattedDate = formatDate(new Date(booking.bookingDate));
      const timeRange = `${booking.startTime} - ${booking.endTime}`;

      if (status === "CONFIRMED") {
        await sendWhatsAppMessage(
          booking.customerPhone,
          getBookingConfirmationMessage(
            business?.name ?? "",
            service?.name ?? "",
            formattedDate,
            timeRange,
            booking.uniqueId
          )
        );
      }

      if (status === "CANCELLED") {
        await sendWhatsAppMessage(
          booking.customerPhone,
          getBookingCancellationMessage(
            business?.name ?? "",
            service?.name ?? "",
            formattedDate,
            timeRange
          )
        );
      }
    }

    // =====================
    // RESPONSE LIMPIA
    // =====================
    return NextResponse.json({
      id: booking.id,
      status: booking.status,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      uniqueId: booking.uniqueId,
      service: service
        ? {
            id: service.id,
            name: service.name,
            price: service.price?.toString() ?? "0",
          }
        : null,
      business: business
        ? {
            id: business.id,
            name: business.name,
          }
        : null,
    });
  } catch (error) {
    console.error("PUT booking error:", error);
    return NextResponse.json(
      { error: "Error al actualizar reserva" },
      { status: 500 }
    );
  }
}
