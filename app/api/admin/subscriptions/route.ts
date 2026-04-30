export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { Business, Subscription, Op, initDb } from '@/lib/db';

type StatusFilter = 'all' | 'trial' | 'active' | 'expiring' | 'past_due' | 'suspended' | 'cancelled';

export async function GET(request: NextRequest) {
  try {
    await initDb();

    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const status = (request.nextUrl.searchParams.get('status') ?? 'all') as StatusFilter;

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const where: any = {};
    if (status === 'trial') where.status = 'TRIAL';
    else if (status === 'active') where.status = 'ACTIVE';
    else if (status === 'past_due') where.status = 'PAST_DUE';
    else if (status === 'suspended') where.status = 'SUSPENDED';
    else if (status === 'cancelled') where.status = 'CANCELLED';
    else if (status === 'expiring') {
      where.paidUntil = { [Op.between]: [now, in7Days] };
    }

    const subs = await Subscription.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    const businessIds = subs.map((s) => s.businessId);
    const businesses = businessIds.length
      ? await Business.findAll({
          where: { id: { [Op.in]: businessIds } },
          attributes: ['id', 'name', 'slug', 'isActive'],
        })
      : [];
    const bizMap = new Map(businesses.map((b) => [b.id, b.get({ plain: true })]));

    const result = subs.map((s) => {
      const plain = s.get({ plain: true });
      const referenceDate: Date | null =
        plain.paidUntil ?? (plain.status === 'TRIAL' ? plain.trialEndsAt : null);
      const daysUntilExpiry =
        referenceDate
          ? Math.ceil((new Date(referenceDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
          : null;

      return {
        id: plain.id,
        businessId: plain.businessId,
        business: bizMap.get(plain.businessId) ?? null,
        status: plain.status,
        monthlyPrice: parseFloat(plain.monthlyPrice as any) || 0,
        trialEndsAt: plain.trialEndsAt,
        paidUntil: plain.paidUntil,
        lastPaymentAt: plain.lastPaymentAt,
        daysUntilExpiry,
        createdAt: plain.createdAt,
      };
    });

    // MRR: sumar precios de ACTIVE y PAST_DUE de TODAS las subs (no del filtro actual)
    const mrrSubs = await Subscription.findAll({
      where: { status: { [Op.in]: ['ACTIVE', 'PAST_DUE'] } },
      attributes: ['monthlyPrice'],
    });
    const mrr = mrrSubs.reduce((acc, s) => acc + (parseFloat(s.get('monthlyPrice') as any) || 0), 0);

    return NextResponse.json({ subscriptions: result, mrr });
  } catch (error) {
    console.error('GET admin subscriptions error:', error);
    return NextResponse.json({ error: 'Error al obtener suscripciones' }, { status: 500 });
  }
}
