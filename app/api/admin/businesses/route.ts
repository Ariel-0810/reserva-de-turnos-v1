export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { Business, User, Booking, Service, initDb } from '@/lib/db';

export async function GET() {
  try {
    await initDb();
    
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // No usar include debido a bug de asociaciones Sequelize/Webpack
    const businesses = await Business.findAll({
      order: [['createdAt', 'DESC']],
    });

    // Get counts and user data for each business with manual queries
    const result = await Promise.all(
      businesses.map(async (b) => {
        const plain = b.get({ plain: true });
        
        // Manual queries instead of associations
        const [bookingsCount, servicesCount, user] = await Promise.all([
          Booking.count({ where: { businessId: b.id } }),
          Service.count({ where: { businessId: b.id } }),
          User.findByPk(plain.userId, { attributes: ['email', 'name'] }),
        ]);
        
        return {
          ...plain,
          user: user ? user.get({ plain: true }) : null,
          _count: {
            bookings: bookingsCount,
            services: servicesCount,
          },
        };
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET admin businesses error:', error);
    return NextResponse.json({ error: 'Error al obtener negocios' }, { status: 500 });
  }
}
