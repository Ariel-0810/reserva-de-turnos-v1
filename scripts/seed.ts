import { User, Business, BusinessHours, Service, sequelize } from '../lib/db';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Seeding database...');

  // Sync database (creates tables if they don't exist)
  await sequelize.sync();

  // Create SUPERADMIN
  const adminPassword = await bcrypt.hash('Mi@081013.', 12);
  const [superadmin, createdAdmin] = await User.findOrCreate({
    where: { email: 'g.a.gomez2016@gmail.com' },
    defaults: {
      email: 'g.a.gomez2016@gmail.com',
      password: adminPassword,
      name: 'Super Admin',
      role: 'SUPERADMIN',
      isEmailVerified: true,
    },
  });
  
  if (!createdAdmin) {
    await superadmin.update({ password: adminPassword });
  }
  console.log('Created SUPERADMIN:', superadmin.email);

  // Create test user (john@doe.com) - required for testing
  const testPassword = await bcrypt.hash('johndoe123', 12);
  const [testUser, createdTestUser] = await User.findOrCreate({
    where: { email: 'john@doe.com' },
    defaults: {
      email: 'john@doe.com',
      password: testPassword,
      name: 'John Doe',
      phone: '1234567890',
      role: 'BUSINESS_OWNER',
      isEmailVerified: true,
    },
  });
  
  // Create business for test user if doesn't exist
  let testBusiness = await Business.findOne({
    where: { userId: testUser.id },
  });
  
  if (!testBusiness) {
    testBusiness = await Business.create({
      userId: testUser.id,
      name: "John's Business",
      slug: 'johns-business',
      description: 'Negocio de prueba',
    });
    
    await BusinessHours.bulkCreate(
      [0, 1, 2, 3, 4, 5, 6].map((day) => ({
        businessId: testBusiness!.id,
        dayOfWeek: day,
        isOpen: day !== 0,
        openTime: '09:00',
        closeTime: '18:00',
      }))
    );
  }
  console.log('Created test user: john@doe.com');

  // Create demo business owner
  const demoPassword = await bcrypt.hash('Demo123!', 12);
  const [demoUser, createdDemoUser] = await User.findOrCreate({
    where: { email: 'demo@business.com' },
    defaults: {
      email: 'demo@business.com',
      password: demoPassword,
      name: 'Demo Owner',
      phone: '11-5555-1234',
      role: 'BUSINESS_OWNER',
      isEmailVerified: true,
    },
  });

  // Check if demo business exists
  let demoBusiness = await Business.findOne({
    where: { userId: demoUser.id },
  });

  if (!demoBusiness) {
    demoBusiness = await Business.create({
      userId: demoUser.id,
      name: 'Peluquería Demo',
      slug: 'peluqueria-demo',
      description: 'La mejor peluquería de la ciudad',
      address: 'Av. Corrientes 1234, CABA',
      phone: '11-4444-5555',
    });
    
    await BusinessHours.bulkCreate([
      { businessId: demoBusiness.id, dayOfWeek: 0, isOpen: false, openTime: '09:00', closeTime: '17:00' },
      { businessId: demoBusiness.id, dayOfWeek: 1, isOpen: true, openTime: '09:00', closeTime: '19:00' },
      { businessId: demoBusiness.id, dayOfWeek: 2, isOpen: true, openTime: '09:00', closeTime: '19:00' },
      { businessId: demoBusiness.id, dayOfWeek: 3, isOpen: true, openTime: '09:00', closeTime: '19:00' },
      { businessId: demoBusiness.id, dayOfWeek: 4, isOpen: true, openTime: '09:00', closeTime: '19:00' },
      { businessId: demoBusiness.id, dayOfWeek: 5, isOpen: true, openTime: '09:00', closeTime: '19:00' },
      { businessId: demoBusiness.id, dayOfWeek: 6, isOpen: true, openTime: '10:00', closeTime: '15:00' },
    ]);
  }

  console.log('Created demo user:', demoUser.email);

  // Create demo services
  const existingServices = await Service.count({
    where: { businessId: demoBusiness.id },
  });

  if (existingServices === 0) {
    await Service.bulkCreate([
      {
        businessId: demoBusiness.id,
        name: 'Corte de cabello',
        description: 'Corte clásico o moderno según tu preferencia',
        durationMinutes: 30,
        price: 3500,
        isActive: true,
      },
      {
        businessId: demoBusiness.id,
        name: 'Corte + Barba',
        description: 'Combo completo de corte y arreglo de barba',
        durationMinutes: 45,
        price: 5000,
        isActive: true,
      },
      {
        businessId: demoBusiness.id,
        name: 'Coloración',
        description: 'Tinte completo con productos premium',
        durationMinutes: 90,
        price: 8000,
        isActive: true,
      },
      {
        businessId: demoBusiness.id,
        name: 'Tratamiento capilar',
        description: 'Hidratación profunda y nutrición',
        durationMinutes: 60,
        price: 4500,
        isActive: true,
      },
    ]);
    console.log('Created demo services');
  }

  console.log('Seed completed successfully!');
  console.log('');
  console.log('=== Credenciales de acceso ===');
  console.log('');
  console.log('SUPERADMIN:');
  console.log('  Email: g.a.gomez2016@gmail.com');
  console.log('  Password: Mi@081013.');
  console.log('');
  console.log('DEMO BUSINESS OWNER:');
  console.log('  Email: demo@business.com');
  console.log('  Password: Demo123!');
  console.log('  Link de reservas: /booking/peluqueria-demo');
  console.log('');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await sequelize.close();
  });
