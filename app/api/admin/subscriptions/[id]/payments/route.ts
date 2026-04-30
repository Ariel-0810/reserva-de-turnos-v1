export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { Subscription, Payment, initDb } from '@/lib/db';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    await initDb();
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payments = await Payment.findAll({
      where: { subscriptionId: params.id },
      order: [['paidAt', 'DESC']],
    });
    return NextResponse.json(payments.map((p) => p.get({ plain: true })));
  } catch (error) {
    console.error('GET payments error:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await initDb();
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const sub = await Subscription.findByPk(params.id);
    if (!sub) return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 });

    const body = await request.json();
    const { amount, paidAt, method, notes, externalRef } = body ?? {};

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
    }
    if (method !== 'MANUAL_TRANSFER' && method !== 'MERCADOPAGO') {
      return NextResponse.json({ error: 'Método inválido' }, { status: 400 });
    }
    const paidAtDate = paidAt ? new Date(paidAt) : new Date();
    if (isNaN(paidAtDate.getTime())) {
      return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 });
    }

    const payment = await Payment.create({
      subscriptionId: sub.id,
      businessId: sub.businessId,
      amount: amountNum,
      currency: 'ARS',
      method,
      externalRef: externalRef ?? null,
      paidAt: paidAtDate,
      notes: notes ?? null,
      createdBy: (session.user as any).id,
    });

    // Extender paidUntil: max(paidUntil actual, paidAt) + 30 días
    const baseDate =
      sub.paidUntil && new Date(sub.paidUntil) > paidAtDate ? new Date(sub.paidUntil) : paidAtDate;
    const newPaidUntil = new Date(baseDate.getTime());
    newPaidUntil.setDate(newPaidUntil.getDate() + 30);

    await sub.update({
      lastPaymentAt: paidAtDate,
      paidUntil: newPaidUntil,
      status: 'ACTIVE',
    });

    return NextResponse.json({
      success: true,
      payment: payment.get({ plain: true }),
      subscription: sub.get({ plain: true }),
    });
  } catch (error) {
    console.error('POST payment error:', error);
    return NextResponse.json({ error: 'Error al registrar pago' }, { status: 500 });
  }
}
