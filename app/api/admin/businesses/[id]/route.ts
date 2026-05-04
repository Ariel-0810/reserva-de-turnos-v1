export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  Business, Booking, BusinessHours, Service,
  Subscription, Payment, RecurringBlock,
  sequelize,
} from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const businessId = params?.id;
    const body = await request.json();
    const { isActive } = body ?? {};

    await Business.update(
      { isActive },
      { where: { id: businessId } }
    );

    const business = await Business.findByPk(businessId);

    return NextResponse.json(business);
  } catch (error) {
    console.error('PUT admin business error:', error);
    return NextResponse.json({ error: 'Error al actualizar negocio' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const businessId = params?.id;
    if (!businessId) {
      return NextResponse.json({ error: 'businessId requerido' }, { status: 400 });
    }

    const business = await Business.findByPk(businessId);
    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    // Cascade manual envuelta en transacción para garantizar consistencia
    // (el repo no usa FK constraints por bug Webpack/Sequelize).
    await sequelize.transaction(async (t) => {
      await Payment.destroy({ where: { businessId }, transaction: t });
      await Subscription.destroy({ where: { businessId }, transaction: t });
      await RecurringBlock.destroy({ where: { businessId }, transaction: t });
      await Booking.destroy({ where: { businessId }, transaction: t });
      await BusinessHours.destroy({ where: { businessId }, transaction: t });
      await Service.destroy({ where: { businessId }, transaction: t });
      await business.destroy({ transaction: t });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE admin business error:', error);
    return NextResponse.json({ error: 'Error al eliminar negocio' }, { status: 500 });
  }
}
