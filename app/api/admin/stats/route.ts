export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { Business, Booking, Op, sequelize, initDb } from '@/lib/db';

function startOfWeekUTC(d: Date): Date {
  const out = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = out.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day; // lunes
  out.setUTCDate(out.getUTCDate() + diff);
  return out;
}

export async function GET() {
  try {
    await initDb();

    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const now = new Date();
    const weekStart = startOfWeekUTC(now);
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setUTCDate(prevWeekStart.getUTCDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

    const [
      totalBusinesses,
      activeBusinesses,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      newBusinessesThisWeek,
      bookingsThisWeek,
      bookingsPrevWeek,
    ] = await Promise.all([
      Business.count(),
      Business.count({ where: { isActive: true } }),
      Booking.count(),
      Booking.count({ where: { status: 'PENDING' } }),
      Booking.count({ where: { status: 'CONFIRMED' } }),
      Booking.count({ where: { status: 'CANCELLED' } }),
      Business.count({ where: { createdAt: { [Op.gte]: weekStart } } }),
      Booking.count({ where: { createdAt: { [Op.gte]: weekStart } } }),
      Booking.count({ where: { createdAt: { [Op.gte]: prevWeekStart, [Op.lt]: weekStart } } }),
    ]);

    // Breakdown últimos 6 meses por bookingDate
    const monthsRows: any = await sequelize.query(
      `SELECT to_char(date_trunc('month', "bookingDate"::date), 'YYYY-MM') AS month,
              COUNT(*)::int AS count
       FROM "Booking"
       WHERE "bookingDate"::date >= (CURRENT_DATE - INTERVAL '6 months')
       GROUP BY month
       ORDER BY month ASC`,
      { type: 'SELECT' }
    );

    // Top 3 negocios por # bookings
    const topRows: any = await sequelize.query(
      `SELECT b."id" AS id, b."name" AS name, b."slug" AS slug, COUNT(bk."id")::int AS bookings
       FROM "Business" b
       LEFT JOIN "Booking" bk ON bk."businessId" = b."id"
       GROUP BY b."id"
       ORDER BY bookings DESC
       LIMIT 3`,
      { type: 'SELECT' }
    );

    // Negocios sin actividad 30d (sin reservas creadas en últimos 30d)
    const inactiveRows: any = await sequelize.query(
      `SELECT b."id" AS id, b."name" AS name, b."slug" AS slug, b."createdAt" AS "createdAt", b."isActive" AS "isActive"
       FROM "Business" b
       WHERE NOT EXISTS (
         SELECT 1 FROM "Booking" bk
         WHERE bk."businessId" = b."id" AND bk."createdAt" >= :since
       )
       ORDER BY b."createdAt" ASC
       LIMIT 20`,
      { type: 'SELECT', replacements: { since: thirtyDaysAgo } }
    );

    const cancellationRate =
      totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 1000) / 10 : 0;
    const bookingsWoWPct =
      bookingsPrevWeek > 0
        ? Math.round(((bookingsThisWeek - bookingsPrevWeek) / bookingsPrevWeek) * 1000) / 10
        : null;

    return NextResponse.json({
      totalBusinesses,
      activeBusinesses,
      inactiveBusinesses: totalBusinesses - activeBusinesses,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      cancellationRate, // % con 1 decimal
      newBusinessesThisWeek,
      bookingsThisWeek,
      bookingsPrevWeek,
      bookingsWoWPct, // null si no hay base
      bookingsByMonth: monthsRows ?? [],
      topBusinesses: topRows ?? [],
      inactiveBusinesses30d: inactiveRows ?? [],
    });
  } catch (error) {
    console.error('GET admin stats error:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}
