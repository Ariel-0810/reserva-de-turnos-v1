export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
//import { Business, User, BusinessHours, Op } from '@/lib/db';
import { Business } from '@/lib/models/Business';
import { User } from '@/lib/models/User';
import { BusinessHours } from '@/lib/models/BusinessHours';
import { Op } from 'sequelize';
import { initDb } from '@/lib/db';
import { isValidSlug } from '@/lib/utils';

export async function GET() {
  try {
    await initDb();
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    
    // Query sin asociaciones
    const business = await Business.findOne({
      where: { userId },
    });

    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    // Obtener datos relacionados manualmente
    const user = await User.findByPk(userId, {
      attributes: ['name', 'email', 'phone']
    });
    
    const hours = await BusinessHours.findAll({
      where: { businessId: business.id },
      order: [['dayOfWeek', 'ASC']],
    });

    // Combinar resultados
    const businessData = {
      ...business.get({ plain: true }),
      user: user ? user.get({ plain: true }) : null,
      hours: hours.map(h => h.get({ plain: true })),
    };

    return NextResponse.json(businessData);
  } catch (error) {
    console.error('GET business error:', error);
    return NextResponse.json({ error: 'Error al obtener negocio' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    const businessId = (session.user as any)?.businessId;

    const body = await request.json();
    const { name, slug, description, address, phone, whatsappNumber, ownerName, ownerPhone } = body ?? {};

    // Validate slug if provided
    if (slug) {
      if (!isValidSlug(slug)) {
        return NextResponse.json(
          { error: 'El slug debe contener solo letras minúsculas, números y guiones (3-50 caracteres)' },
          { status: 400 }
        );
      }

      const existingSlug = await Business.findOne({
        where: { slug, id: { [Op.ne]: businessId } },
      });

      if (existingSlug) {
        return NextResponse.json(
          { error: 'Este slug ya está en uso' },
          { status: 400 }
        );
      }
    }

    // Update user info if provided
    if (ownerName || ownerPhone) {
      await User.update(
        {
          ...(ownerName && { name: ownerName }),
          ...(ownerPhone && { phone: ownerPhone }),
        },
        { where: { id: userId } }
      );
    }

    await Business.update(
      {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(whatsappNumber !== undefined && { whatsappNumber }),
      },
      { where: { id: businessId } }
    );

    // Obtener datos actualizados sin asociaciones
    const updated = await Business.findOne({
      where: { id: businessId },
    });

    if (updated) {
      const user = await User.findByPk(userId, {
        attributes: ['name', 'email', 'phone']
      });
      
      const hours = await BusinessHours.findAll({
        where: { businessId: updated.id },
        order: [['dayOfWeek', 'ASC']],
      });

      const businessData = {
        ...updated.get({ plain: true }),
        user: user ? user.get({ plain: true }) : null,
        hours: hours.map(h => h.get({ plain: true })),
      };

      return NextResponse.json(businessData);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT business error:', error);
    return NextResponse.json({ error: 'Error al actualizar negocio' }, { status: 500 });
  }
}
