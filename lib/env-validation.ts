/**
 * Validación de variables de entorno requeridas
 * Este archivo verifica que todas las variables críticas estén definidas
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
] as const;

const optionalEnvVars = [
  'RESEND_API_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_WHATSAPP_NUMBER',
  'SUPERADMIN_EMAIL',
] as const;

export function validateEnv() {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Verificar variables requeridas
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar] || process.env[envVar]?.trim() === '') {
      missing.push(envVar);
    }
  }

  // Verificar variables opcionales (solo advertencias)
  for (const envVar of optionalEnvVars) {
    if (!process.env[envVar] || process.env[envVar]?.trim() === '') {
      warnings.push(envVar);
    }
  }

  // Si faltan variables requeridas, lanzar error
  if (missing.length > 0) {
    throw new Error(
      `❌ Faltan las siguientes variables de entorno requeridas:\n${missing.map(v => `  - ${v}`).join('\n')}\n\n` +
      `Por favor, configúralas en tu archivo .env o en las variables de entorno de Vercel.`
    );
  }

  // Mostrar advertencias para variables opcionales
  if (warnings.length > 0 && process.env.NODE_ENV !== 'production') {
    console.warn(
      `⚠️  Variables de entorno opcionales no configuradas:\n${warnings.map(v => `  - ${v}`).join('\n')}\n` +
      `Algunas funcionalidades pueden no estar disponibles.`
    );
  }

  return true;
}

// Solo validar en runtime, no durante el build
if (process.env.NEXT_PHASE !== 'phase-production-build') {
  try {
    validateEnv();
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }
    // No lanzar error durante el import, solo advertir
  }
}
