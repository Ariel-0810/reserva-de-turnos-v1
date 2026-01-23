export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
//import { BusinessHours } from '@/lib/db';
import { BusinessHours } from '@/lib/models/BusinessHours';
import { initDb } from '@/lib/db';
import { timeToMinutes } from '@/lib/utils';

export async function PUT(request: Request) {
  try {
    await initDb();
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const businessId = (session.user as any)?.businessId;
    if (!businessId) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { hours } = body ?? {};

    if (!hours || !Array.isArray(hours)) {
      return NextResponse.json({ error: 'Datos de horarios inválidos' }, { status: 400 });
    }

    // Validate hours
    for (const hour of hours) {
      if (hour?.isOpen) {
        const openMinutes = timeToMinutes(hour?.openTime ?? '00:00');
        const closeMinutes = timeToMinutes(hour?.closeTime ?? '00:00');
        if (openMinutes >= closeMinutes) {
          return NextResponse.json(
            { error: 'La hora de apertura debe ser anterior a la de cierre' },
            { status: 400 }
          );
        }
      }
    }

    // Update hours using upsert (findOrCreate + update)
    for (const hour of hours) {
      const [record, created] = await BusinessHours.findOrCreate({
        where: {
          businessId,
          dayOfWeek: hour?.dayOfWeek ?? 0,
        },
        defaults: {
          businessId,
          dayOfWeek: hour?.dayOfWeek ?? 0,
          isOpen: hour?.isOpen ?? false,
          openTime: hour?.openTime ?? '09:00',
          closeTime: hour?.closeTime ?? '23:00',
        },
      });

      if (!created) {
        await record.update({
          isOpen: hour?.isOpen ?? false,
          openTime: hour?.openTime ?? '09:00',
          closeTime: hour?.closeTime ?? '23:00',
        });
      }
    }

    const updatedHours = await BusinessHours.findAll({
      where: { businessId },
      order: [['dayOfWeek', 'ASC']],
    });

    return NextResponse.json(updatedHours);
  } catch (error) {
    console.error('PUT hours error:', error);
    return NextResponse.json({ error: 'Error al actualizar horarios' }, { status: 500 });
  }
}
