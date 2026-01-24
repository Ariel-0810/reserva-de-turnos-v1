// ✅ Caché corto para slots (30 segundos)
export const revalidate = 30;

import { NextResponse } from 'next/server';
//import { Service, BusinessHours, Booking, Op } from '@/lib/db';
import { Service } from '@/lib/models/Service';
import { BusinessHours } from '@/lib/models/BusinessHours';
import { Booking } from '@/lib/models/Booking';
import { Op } from 'sequelize';
import { initDb } from '@/lib/db';
import { generateTimeSlots } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    await initDb();
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const serviceId = searchParams.get('serviceId');
    const date = searchParams.get('date');

    if (!businessId || !serviceId || !date) {
      return NextResponse.json({ error: 'Parámetros requeridos: businessId, serviceId, date' }, { status: 400 });
    }

    const service = await Service.findOne({
      where: { id: serviceId, businessId, isActive: true },
    });

    if (!service) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }

    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    const hours = await BusinessHours.findOne({
      where: { businessId, dayOfWeek },
    });

    if (!hours || !hours.isOpen) {
      return NextResponse.json(
        { slots: [], message: 'Cerrado este día' },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          },
        }
      );
    }

    // ✅ Get existing bookings for this date AND SERVICE (cada servicio tiene sus propios slots)
    const existingBookings = await Booking.findAll({
      where: {
        businessId,
        serviceId, // ✅ CRÍTICO: Filtrar por serviceId para que cada servicio tenga slots independientes
        bookingDate: date,
        status: { [Op.in]: ['PENDING', 'CONFIRMED'] },
      },
      attributes: ['startTime', 'endTime'],
    });

    const slots = generateTimeSlots(
      hours?.openTime ?? '09:00',
      hours?.closeTime ?? '17:00',
      service?.durationMinutes ?? 60,
      existingBookings.map(b => b.get({ plain: true })) ?? []
    );

    // ✅ Caché de 30 segundos para slots disponibles
    return NextResponse.json(
      { slots },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('GET slots error:', error);
    return NextResponse.json({ error: 'Error al obtener horarios' }, { status: 500 });
  }
}
