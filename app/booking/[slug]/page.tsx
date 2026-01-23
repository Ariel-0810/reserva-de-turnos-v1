import { Business } from '@/lib/models/Business';
import { BusinessHours } from '@/lib/models/BusinessHours';
import { Service } from '@/lib/models/Service';
import { User } from '@/lib/models/User';
import { initDb } from '@/lib/db';
import { notFound } from 'next/navigation';
import { BookingClient } from './_components/booking-client';

export const dynamic = 'force-dynamic';

export default async function PublicBookingPage({
  params,
}: {
  params: { slug: string };
}) {
  await initDb();

  // Query sin asociaciones
  const business = await Business.findOne({
    where: { slug: params.slug, isActive: true },
  });

  if (!business) {
    notFound();
  }

  // Obtener datos relacionados manualmente
  const hours = await BusinessHours.findAll({
    where: { businessId: business.id },
    order: [['dayOfWeek', 'ASC']],
  });

  const services = await Service.findAll({
    where: { 
      businessId: business.id,
      isActive: true 
    },
    order: [['name', 'ASC']],
  });

  const user = await User.findByPk(business.userId, {
    attributes: ['phone'],
  });

  // Combinar resultados
  const businessPlain = {
    ...business.get({ plain: true }),
    hours: hours.map(h => h.get({ plain: true })),
    services: services.map(s => s.get({ plain: true })),
    user: user ? user.get({ plain: true }) : null,
  };

  const serializedBusiness = {
    id: businessPlain.id,
    name: businessPlain.name,
    slug: businessPlain.slug,
    description: businessPlain.description,
    address: businessPlain.address,
    phone: businessPlain.phone,
    hours: businessPlain.hours ?? [],
    services: (businessPlain.services ?? []).map((s: any) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      durationMinutes: s.durationMinutes,
      price: s.price?.toString() ?? '0',
    })),
    // Prefer business whatsappNumber, fallback to owner phone
    ownerWhatsApp:
      businessPlain.whatsappNumber ||
      businessPlain.user?.phone ||
      null,
  };

  return <BookingClient business={serializedBusiness} />;
}
