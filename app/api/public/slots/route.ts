export const dynamic = 'force-dynamic';

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
      return NextResponse.json({ slots: [], message: 'Cerrado este día' });
    }

    // Get existing bookings for this date
    const existingBookings = await Booking.findAll({
      where: {
        businessId,
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

    return NextResponse.json({ slots });
  } catch (error) {
    console.error('GET slots error:', error);
    return NextResponse.json({ error: 'Error al obtener horarios' }, { status: 500 });
  }
}
