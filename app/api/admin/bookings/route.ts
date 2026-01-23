export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { Booking, Service, Business } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const businessId = searchParams.get('businessId');

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (businessId && businessId !== 'all') {
      where.businessId = businessId;
    }

    const bookings = await Booking.findAll({
      where,
      include: [
        { model: Service, as: 'service' },
        { model: Business, as: 'business', attributes: ['name', 'slug'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 100,
    });

    const serialized = (bookings ?? []).map((b) => {
      const plain = b.get({ plain: true }) as any;
      return {
        ...plain,
        service: plain?.service ? { ...plain.service, price: plain.service?.price?.toString() ?? '0' } : null,
      };
    });

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('GET admin bookings error:', error);
    return NextResponse.json({ error: 'Error al obtener reservas' }, { status: 500 });
  }
}
