export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { Business, User, Service, Booking, BusinessHours, initDb } from '@/lib/db';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await initDb();

    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const business = await Business.findByPk(params.id);
    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }
    const businessPlain = business.get({ plain: true });

    const [user, services, hours, recentBookings] = await Promise.all([
      User.findByPk(businessPlain.userId, { attributes: ['name', 'email', 'phone'] }),
      Service.findAll({ where: { businessId: params.id }, order: [['name', 'ASC']] }),
      BusinessHours.findAll({ where: { businessId: params.id }, order: [['dayOfWeek', 'ASC']] }),
      Booking.findAll({
        where: { businessId: params.id },
        order: [['createdAt', 'DESC']],
        limit: 20,
      }),
    ]);

    // Para cada booking, traer service.name (manual por bug Sequelize/Webpack)
    const bookingsWithService = await Promise.all(
      recentBookings.map(async (bk) => {
        const p = bk.get({ plain: true }) as any;
        const svc = await Service.findByPk(p.serviceId, { attributes: ['name', 'price'] });
        return {
          ...p,
          service: svc
            ? { name: svc.get('name'), price: (svc.get('price') as any)?.toString() ?? '0' }
            : null,
        };
      })
    );

    return NextResponse.json({
      business: businessPlain,
      user: user ? user.get({ plain: true }) : null,
      services: services.map((s) => {
        const p = s.get({ plain: true }) as any;
        return { ...p, price: p.price?.toString() ?? '0' };
      }),
      hours: hours.map((h) => h.get({ plain: true })),
      recentBookings: bookingsWithService,
    });
  } catch (error) {
    console.error('GET admin business details error:', error);
    return NextResponse.json({ error: 'Error al obtener detalle' }, { status: 500 });
  }
}
