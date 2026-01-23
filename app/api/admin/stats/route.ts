export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { Business, Booking } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const [totalBusinesses, activeBusinesses, totalBookings, pendingBookings, confirmedBookings] =
      await Promise.all([
        Business.count(),
        Business.count({ where: { isActive: true } }),
        Booking.count(),
        Booking.count({ where: { status: 'PENDING' } }),
        Booking.count({ where: { status: 'CONFIRMED' } }),
      ]);

    return NextResponse.json({
      totalBusinesses,
      activeBusinesses,
      inactiveBusinesses: totalBusinesses - activeBusinesses,
      totalBookings,
      pendingBookings,
      confirmedBookings,
    });
  } catch (error) {
    console.error('GET admin stats error:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}
