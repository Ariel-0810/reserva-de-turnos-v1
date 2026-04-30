export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { sequelize, initDb } from '@/lib/db';

function startOfWeekISO(d: Date): string {
  const out = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = out.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  out.setUTCDate(out.getUTCDate() + diff);
  return out.toISOString().slice(0, 10);
}

function endOfWeekISO(d: Date): string {
  const start = new Date(startOfWeekISO(d));
  start.setUTCDate(start.getUTCDate() + 6);
  return start.toISOString().slice(0, 10);
}

export async function GET() {
  try {
    await initDb();

    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const now = new Date();
    const weekFrom = startOfWeekISO(now);
    const weekTo = endOfWeekISO(now);

    const rows: any = await sequelize.query(
      `SELECT
         COUNT(*) FILTER (WHERE bk."status" = 'CONFIRMED' AND bk."bookingDate"::date BETWEEN :from AND :to)::int AS confirmed_count,
         COUNT(*) FILTER (WHERE bk."status" = 'CANCELLED' AND bk."bookingDate"::date BETWEEN :from AND :to)::int AS cancelled_count,
         COALESCE(SUM(s."price") FILTER (WHERE bk."status" = 'CONFIRMED' AND bk."bookingDate"::date BETWEEN :from AND :to), 0)::numeric AS projected_revenue
       FROM "Booking" bk
       LEFT JOIN "Service" s ON s."id" = bk."serviceId"`,
      { type: 'SELECT', replacements: { from: weekFrom, to: weekTo } }
    );

    const r = (rows && rows[0]) || {};

    return NextResponse.json({
      weekFrom,
      weekTo,
      confirmedThisWeek: Number(r.confirmed_count ?? 0),
      cancelledThisWeek: Number(r.cancelled_count ?? 0),
      projectedRevenueThisWeek: r.projected_revenue?.toString?.() ?? '0',
    });
  } catch (error) {
    console.error('GET admin bookings metrics error:', error);
    return NextResponse.json({ error: 'Error al obtener métricas' }, { status: 500 });
  }
}
