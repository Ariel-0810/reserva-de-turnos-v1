export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { Booking, Service, Business, initDb } from '@/lib/db';

export async function GET(request: Request) {
  try {
    await initDb();
    
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const businessId = searchParams.get('businessId');

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (businessId && businessId !== 'all') {
      where.businessId = businessId;
    }

    // No usar include debido a bug de asociaciones Sequelize/Webpack
    const bookings = await Booking.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 100,
    });

    // Manual queries para obtener service y business
    const serialized = await Promise.all((bookings ?? []).map(async (b) => {
      const plain = b.get({ plain: true }) as any;
      
      // Obtener service y business manualmente
      const [service, business] = await Promise.all([
        Service.findByPk(plain.serviceId),
        Business.findByPk(plain.businessId, { attributes: ['name', 'slug'] }),
      ]);
      
      return {
        ...plain,
        service: service ? {
          ...service.get({ plain: true }),
          price: service.get('price')?.toString() ?? '0'
        } : null,
        business: business ? business.get({ plain: true }) : null,
      };
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('GET admin bookings error:', error);
    return NextResponse.json({ error: 'Error al obtener reservas' }, { status: 500 });
  }
}
