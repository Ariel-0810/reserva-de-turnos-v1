export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
//import { Booking, Service, Op } from '@/lib/db';
import { initDb } from '@/lib/db';
import { Booking } from '@/lib/models/Booking';
import { Service } from '@/lib/models/Service';

export async function GET(request: Request) {
  try {
    await initDb();
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const businessId = (session.user as any)?.businessId;
    if (!businessId) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');

    const where: any = { businessId };
    if (status && status !== 'all') {
      where.status = status;
    }
    if (date) {
      where.bookingDate = date; // DATEONLY format
    }

    const bookings = await Booking.findAll({
      where,
      order: [['bookingDate', 'DESC'], ['startTime', 'ASC']],
    });

    // Manually fetch services for each booking
    const serialized = await Promise.all(
      (bookings ?? []).map(async (b) => {
        const plain = b.get({ plain: true }) as any;
        
        // Fetch service manually
        const service = await Service.findByPk(plain.serviceId);
        
        return {
          ...plain,
          service: service ? {
            id: service.id,
            name: service.name,
            description: service.description,
            durationMinutes: service.durationMinutes,
            price: service.price?.toString() ?? '0',
            isActive: service.isActive,
          } : null,
        };
      })
    );

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('GET bookings error:', error);
    return NextResponse.json({ error: 'Error al obtener reservas' }, { status: 500 });
  }
}
