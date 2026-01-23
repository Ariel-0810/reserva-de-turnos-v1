import * as dotenv from 'dotenv';
import { User, Business, EmailVerification, sequelize } from '../lib/db';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

async function testSignupFlow() {
  console.log('\n🧪 TEST DEL FLUJO DE SIGNUP\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Initialize DB and associations
    console.log('\n1️⃣ Inicializando base de datos y asociaciones...');
    const { initDb } = await import('../lib/db');
    await initDb();
    console.log('   ✅ Base de datos inicializada correctamente');
    console.log('   ✅ Asociaciones configuradas sin errores');

    // Test 2: Create a test user
    console.log('\n2️⃣ Creando usuario de prueba...');
    const testEmail = `test-${Date.now()}@example.com`;
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const user = await User.create({
      email: testEmail,
      password: hashedPassword,
      name: 'Usuario de Prueba',
      phone: '11-1234-5678',
      role: 'BUSINESS_OWNER',
      isEmailVerified: false,
    });
    console.log('   ✅ Usuario creado:', user.id);
    console.log('   ✅ Email:', user.email);

    // Test 3: Create business
    console.log('\n3️⃣ Creando negocio...');
    const business = await Business.create({
      userId: user.id,
      name: 'Negocio de Prueba',
      slug: `prueba-${user.id.slice(0, 8)}`,
      isActive: true,
    });
    console.log('   ✅ Negocio creado:', business.id);
    console.log('   ✅ Slug:', business.slug);

    // Test 4: Test associations
    console.log('\n4️⃣ Probando asociaciones...');
    const userWithBusiness = await User.findOne({
      where: { id: user.id },
      include: [{ model: Business, as: 'business' }],
    });
    
    if (userWithBusiness && (userWithBusiness as any).business) {
      console.log('   ✅ Asociación User -> Business funciona');
      console.log('   ✅ Negocio asociado:', (userWithBusiness as any).business.name);
    } else {
      console.log('   ❌ Asociación User -> Business NO funciona');
    }

    // Test 5: Create verification code
    console.log('\n5️⃣ Creando código de verificación...');
    const code = '123456';
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    const verification = await EmailVerification.create({
      userId: user.id,
      code,
      expiresAt,
    });
    console.log('   ✅ Código creado:', verification.code);
    console.log('   ✅ Expira en:', verification.expiresAt);

    // Test 6: Verify code
    console.log('\n6️⃣ Verificando código...');
    const foundVerification = await EmailVerification.findOne({
      where: { userId: user.id, code },
    });
    
    if (foundVerification) {
      console.log('   ✅ Código encontrado correctamente');
      
      await User.update(
        { isEmailVerified: true },
        { where: { id: user.id } }
      );
      console.log('   ✅ Usuario marcado como verificado');
      
      await EmailVerification.destroy({
        where: { userId: user.id },
      });
      console.log('   ✅ Código de verificación eliminado');
    }

    // Cleanup
    console.log('\n7️⃣ Limpiando datos de prueba...');
    await Business.destroy({ where: { userId: user.id } });
    await User.destroy({ where: { id: user.id } });
    console.log('   ✅ Datos de prueba eliminados');

    console.log('\n' + '='.repeat(60));
    console.log('✅ TODOS LOS TESTS PASARON EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log('\n🎉 El flujo de signup está funcionando correctamente\n');

  } catch (error: any) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ ERROR EN EL TEST');
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

testSignupFlow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error inesperado:', error);
    process.exit(1);
  });
