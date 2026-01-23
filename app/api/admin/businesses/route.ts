export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { Business, User, Booking, Service } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const businesses = await Business.findAll({
      include: [
        { model: User, as: 'user', attributes: ['email', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Get counts for each business
    const result = await Promise.all(
      businesses.map(async (b) => {
        const plain = b.get({ plain: true });
        const [bookingsCount, servicesCount] = await Promise.all([
          Booking.count({ where: { businessId: b.id } }),
          Service.count({ where: { businessId: b.id } }),
        ]);
        return {
          ...plain,
          _count: {
            bookings: bookingsCount,
            services: servicesCount,
          },
        };
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET admin businesses error:', error);
    return NextResponse.json({ error: 'Error al obtener negocios' }, { status: 500 });
  }
}
