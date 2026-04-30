export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { Business, Subscription, initDb } from '@/lib/db';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await initDb();

    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const sub = await Subscription.findByPk(params.id);
    if (!sub) {
      return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const { action, monthlyPrice } = body ?? {};

    if (action === 'suspend') {
      await sub.update({ status: 'SUSPENDED' });
      const business = await Business.findByPk(sub.businessId);
      if (business) await business.update({ isActive: false });
    } else if (action === 'reactivate') {
      const newStatus = sub.paidUntil && new Date(sub.paidUntil) > new Date() ? 'ACTIVE' : 'PAST_DUE';
      await sub.update({ status: newStatus });
      const business = await Business.findByPk(sub.businessId);
      if (business) await business.update({ isActive: true });
    } else if (action === 'cancel') {
      await sub.update({ status: 'CANCELLED' });
      const business = await Business.findByPk(sub.businessId);
      if (business) await business.update({ isActive: false });
    } else if (action === 'change_price') {
      const price = parseFloat(monthlyPrice);
      if (isNaN(price) || price < 0) {
        return NextResponse.json({ error: 'Precio inválido' }, { status: 400 });
      }
      await sub.update({ monthlyPrice: price });
    } else {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
    }

    return NextResponse.json({ success: true, subscription: sub.get({ plain: true }) });
  } catch (error) {
    console.error('PATCH subscription error:', error);
    return NextResponse.json({ error: 'Error al actualizar suscripción' }, { status: 500 });
  }
}
