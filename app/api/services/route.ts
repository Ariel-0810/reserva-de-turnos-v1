export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { Service } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const businessId = (session.user as any)?.businessId;
    if (!businessId) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    const services = await Service.findAll({
      where: { businessId },
      order: [['createdAt', 'DESC']],
    });

    const serializedServices = (services ?? []).map((s) => ({
      ...s.get({ plain: true }),
      price: s?.price?.toString() ?? '0',
    }));

    return NextResponse.json(serializedServices);
  } catch (error) {
    console.error('GET services error:', error);
    return NextResponse.json({ error: 'Error al obtener servicios' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const businessId = (session.user as any)?.businessId;
    if (!businessId) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, durationMinutes, price, isActive } = body ?? {};

    if (!name || !durationMinutes || price === undefined) {
      return NextResponse.json(
        { error: 'Nombre, duración y precio son requeridos' },
        { status: 400 }
      );
    }

    const service = await Service.create({
      businessId,
      name,
      description: description ?? null,
      durationMinutes: parseInt(durationMinutes),
      price: parseFloat(price),
      isActive: isActive ?? true,
    });

    return NextResponse.json({ ...service.get({ plain: true }), price: service?.price?.toString() ?? '0' });
  } catch (error) {
    console.error('POST services error:', error);
    return NextResponse.json({ error: 'Error al crear servicio' }, { status: 500 });
  }
}
