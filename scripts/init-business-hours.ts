// Load environment variables FIRST
import * as dotenv from 'dotenv';
dotenv.config();

// Now import everything else
import { Business, BusinessHours, sequelize } from '../lib/db';

async function initBusinessHours() {
  console.log('\n🕒 Inicializando horarios para negocios...\n');
  console.log('='.repeat(60));

  try {
    const { initDb } = await import('../lib/db');
    await initDb();

    // Obtener todos los negocios
    const businesses = await Business.findAll();
    
    if (businesses.length === 0) {
      console.log('⚠️  No hay negocios en la base de datos');
      return;
    }

    console.log(`📊 Encontrados ${businesses.length} negocio(s)\n`);

    for (const business of businesses) {
      console.log(`\n🏢 Procesando: ${business.name} (${business.slug})`);
      
      // Verificar si ya tiene horarios
      const existingHours = await BusinessHours.findAll({
        where: { businessId: business.id },
      });

      if (existingHours.length > 0) {
        console.log(`   ✅ Ya tiene ${existingHours.length} horarios configurados`);
        continue;
      }

      // Crear horarios predeterminados (Lunes a Viernes 9:00-17:00)
      const defaultHours = [
        { dayOfWeek: 1, isOpen: true, openTime: '09:00', closeTime: '17:00' },  // Lunes
        { dayOfWeek: 2, isOpen: true, openTime: '09:00', closeTime: '17:00' },  // Martes
        { dayOfWeek: 3, isOpen: true, openTime: '09:00', closeTime: '17:00' },  // Miércoles
        { dayOfWeek: 4, isOpen: true, openTime: '09:00', closeTime: '17:00' },  // Jueves
        { dayOfWeek: 5, isOpen: true, openTime: '09:00', closeTime: '17:00' },  // Viernes
        { dayOfWeek: 6, isOpen: false, openTime: '09:00', closeTime: '17:00' }, // Sábado
        { dayOfWeek: 0, isOpen: false, openTime: '09:00', closeTime: '17:00' }, // Domingo
      ];

      console.log('   📝 Creando horarios predeterminados...');
      
      for (const hour of defaultHours) {
        await BusinessHours.create({
          businessId: business.id,
          ...hour,
        });
      }

      console.log('   ✅ Horarios creados exitosamente');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ PROCESO COMPLETADO');
    console.log('='.repeat(60));
    console.log('\n💡 Ahora puedes:');
    console.log('   1. Ir a http://localhost:3000/dashboard/settings');
    console.log('   2. Ajustar los horarios según tus necesidades');
    console.log('   3. Guardar los cambios\n');

  } catch (error: any) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ ERROR');
    console.error('='.repeat(60));
    console.error('\nTipo:', error.name);
    console.error('Mensaje:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

initBusinessHours()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error inesperado:', error);
    process.exit(1);
  });
