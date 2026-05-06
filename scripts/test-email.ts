import { Resend } from 'resend';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

async function testEmail() {
  console.log('\n🔍 VERIFICACIÓN DE CONFIGURACIÓN DE RESEND\n');
  console.log('='.repeat(50));
  
  // 1. Verificar API Key
  const apiKey = process.env.RESEND_API_KEY;
  console.log('\n1. API Key:');
  console.log('   ✓ Presente:', apiKey ? 'Sí' : '❌ NO');
  console.log('   ✓ Formato:', apiKey ? `${apiKey.substring(0, 10)}...` : 'N/A');
  
  if (!apiKey) {
    console.error('\n❌ ERROR: RESEND_API_KEY no está configurada en .env\n');
    return;
  }

  // 2. Crear instancia de Resend
  console.log('\n2. Inicializando Resend...');
  const resend = new Resend(apiKey);
  
  // 3. Intentar enviar email de prueba
  console.log('\n3. Enviando email de prueba...');
  console.log('   - Desde: AgendUp <noreply@bookingsaas.app>');
  console.log('   - Para: soporteagendup@gmail.com');
  
  try {
    const result = await resend.emails.send({
      from: 'AgendUp <noreply@bookingsaas.app>',
      to: 'soporteagendup@gmail.com',
      subject: '🧪 Test de Email - AgendUp',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #22c55e; border-bottom: 3px solid #22c55e; padding-bottom: 10px;">
            ✅ ¡Configuración de Email Exitosa!
          </h2>
          <p style="font-size: 16px; line-height: 1.6;">
            Este es un email de prueba para verificar que tu configuración de Resend está funcionando correctamente.
          </p>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #22c55e;">
            <p style="margin: 0; color: #15803d;">
              <strong>✅ Todo está funcionando perfectamente</strong>
            </p>
            <p style="margin: 10px 0 0 0; color: #15803d; font-size: 14px;">
              Si recibes este email, significa que tu configuración de Resend está correcta.
            </p>
          </div>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            Enviado desde: AgendUp<br>
            Fecha: ${new Date().toLocaleString('es-AR')}
          </p>
        </div>
      `
    });

    console.log('\n✅ EMAIL ENVIADO EXITOSAMENTE!');
    console.log('\nDetalles de la respuesta:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n📬 Revisa tu bandeja de entrada en soporteagendup@gmail.com');
    console.log('   (También revisa la carpeta de spam si no lo ves)\n');
    
  } catch (error: any) {
    console.error('\n❌ ERROR AL ENVIAR EMAIL:\n');
    console.error('Tipo de error:', error.name);
    console.error('Mensaje:', error.message);
    
    if (error.response) {
      console.error('\nRespuesta del servidor:');
      console.error(JSON.stringify(error.response, null, 2));
    }
    
    console.log('\n📝 POSIBLES CAUSAS:\n');
    
    if (error.message.includes('Invalid API key') || error.message.includes('401')) {
      console.log('   1. ❌ API Key inválida o revocada');
      console.log('      → Verifica en https://resend.com/api-keys');
      console.log('      → Asegúrate de que la clave no esté revocada');
    }
    
    if (error.message.includes('domain') || error.message.includes('403')) {
      console.log('   2. ❌ Dominio no verificado');
      console.log('      → Ve a https://resend.com/domains');
      console.log('      → Verifica que bookingsaas.app esté verificado');
      console.log('      → El email "from" debe usar tu dominio verificado');
    }
    
    if (error.message.includes('rate limit') || error.message.includes('429')) {
      console.log('   3. ❌ Límite de tasa excedido');
      console.log('      → Espera unos minutos y vuelve a intentar');
    }
    
    console.log('\n📚 DOCUMENTACIÓN:');
    console.log('   - Resend Docs: https://resend.com/docs');
    console.log('   - API Keys: https://resend.com/api-keys');
    console.log('   - Domains: https://resend.com/domains\n');
  }
}

testEmail()
  .then(() => {
    console.log('\n' + '='.repeat(50));
    console.log('✅ Test completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error inesperado:', error);
    process.exit(1);
  });
