export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { Business } from '@/lib/db';

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
