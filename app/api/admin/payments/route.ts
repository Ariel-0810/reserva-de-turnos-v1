export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { Payment, Business, User, Op, initDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const month = request.nextUrl.searchParams.get('month'); // YYYY-MM
    const method = request.nextUrl.searchParams.get('method'); // MANUAL_TRANSFER | MERCADOPAGO | all

    const where: any = {};
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split('-').map(Number);
      const start = new Date(Date.UTC(y, m - 1, 1));
      const end = new Date(Date.UTC(y, m, 1));
      where.paidAt = { [Op.gte]: start, [Op.lt]: end };
    }
    if (method && method !== 'all') {
      where.method = method;
    }

    const payments = await Payment.findAll({ where, order: [['paidAt', 'DESC']] });

    const businessIds = Array.from(new Set(payments.map((p) => p.businessId)));
    const userIds = Array.from(new Set(payments.map((p) => p.createdBy)));

    const [businesses, users] = await Promise.all([
      businessIds.length
        ? Business.findAll({
            where: { id: { [Op.in]: businessIds } },
            attributes: ['id', 'name', 'slug'],
          })
        : Promise.resolve([] as any[]),
      userIds.length
        ? User.findAll({
            where: { id: { [Op.in]: userIds } },
            attributes: ['id', 'name', 'email'],
          })
        : Promise.resolve([] as any[]),
    ]);

    const bizMap = new Map(businesses.map((b: any) => [b.id, b.get({ plain: true })]));
    const userMap = new Map(users.map((u: any) => [u.id, u.get({ plain: true })]));

    const result = payments.map((p) => {
      const plain = p.get({ plain: true });
      return {
        ...plain,
        amount: parseFloat(plain.amount as any) || 0,
        business: bizMap.get(plain.businessId) ?? null,
        createdByUser: userMap.get(plain.createdBy) ?? null,
      };
    });

    const totalAmount = result.reduce((acc, p) => acc + (p.amount || 0), 0);

    return NextResponse.json({ payments: result, totalAmount });
  } catch (error) {
    console.error('GET admin payments error:', error);
    return NextResponse.json({ error: 'Error al obtener pagos' }, { status: 500 });
  }
}
