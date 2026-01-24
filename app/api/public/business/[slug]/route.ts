// ✅ Revalidar cada 60 segundos (ISR)
export const revalidate = 60;

import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";

import { Business } from "@/lib/models/Business";
import { Service } from "@/lib/models/Service";
import { BusinessHours } from "@/lib/models/BusinessHours";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    await initDb();

    const { slug } = params;

    const business = await Business.findOne({
      where: { slug, isActive: true },
      include: [
        { model: Service, as: "services", where: { isActive: true }, required: false },
        { model: BusinessHours, as: "hours" },
      ],
    });

    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    // ⛔ NO USAR get({ plain: true })
    // ⛔ NO tipar como BusinessAttributes

    const responseData = {
      id: business.id,
      name: business.name,
      description: business.description,
      address: business.address,
      phone: business.phone,
      whatsappNumber: business.whatsappNumber,

      services: (business.services ?? []).map((service) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        durationMinutes: service.durationMinutes,
        price: service.price?.toString() ?? "0",
      })),

      hours: (business.hours ?? []).map((h) => ({
        dayOfWeek: h.dayOfWeek,
        isOpen: h.isOpen,
        openTime: h.openTime,
        closeTime: h.closeTime,
      })),
    };

    // ✅ Agregar headers de caché HTTP
    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error("GET public business error:", error);
    return NextResponse.json(
      { error: "Error al obtener negocio" },
      { status: 500 }
    );
  }
}
