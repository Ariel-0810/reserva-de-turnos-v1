export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { Service } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const businessId = (session.user as any)?.businessId;
    const serviceId = params?.id;

    const service = await Service.findOne({
      where: { id: serviceId, businessId },
    });

    if (!service) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, durationMinutes, price, isActive } = body ?? {};

    await service.update({
      name: name ?? service.name,
      description: description ?? service.description,
      durationMinutes: durationMinutes ? parseInt(durationMinutes) : service.durationMinutes,
      price: price !== undefined ? parseFloat(price) : service.price,
      isActive: isActive !== undefined ? isActive : service.isActive,
    });

    return NextResponse.json({ ...service.get({ plain: true }), price: service?.price?.toString() ?? '0' });
  } catch (error) {
    console.error('PUT service error:', error);
    return NextResponse.json({ error: 'Error al actualizar servicio' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const businessId = (session.user as any)?.businessId;
    const serviceId = params?.id;

    const service = await Service.findOne({
      where: { id: serviceId, businessId },
    });

    if (!service) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }

    await Service.destroy({ where: { id: serviceId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE service error:', error);
    return NextResponse.json({ error: 'Error al eliminar servicio' }, { status: 500 });
  }
}
