import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import { User } from '@/lib/models/User';
import { EmailVerification } from '@/lib/models/EmailVerification';
//import { User, EmailVerification } from '@/lib/db';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    await initDb();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    // Find user by email
    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (user.isEmailVerified) {
      return NextResponse.json({ error: 'Email ya verificado' }, { status: 400 });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete old verification codes
    await EmailVerification.destroy({
      where: { userId: user.id },
    });

    // Create new verification code
    await EmailVerification.create({
      userId: user.id,
      code,
      expiresAt,
    });

    // Send email with code
    const emailResult = await sendEmail({
      to: email,
      subject: 'Código de verificación - AgendUp',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0d9488;">Verifica tu email</h2>
        <p>Tu código de verificación es:</p>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${code}</span>
        </div>
        <p style="color: #6b7280;">Este código expira en 15 minutos.</p>
        <p style="color: #6b7280;">Si no solicitaste este código, ignora este mensaje.</p>
      </div>`,
    });

    if (!emailResult.success) {
      console.error("❌ Error al enviar email de verificación:", emailResult.error);
      return NextResponse.json({ 
        error: 'Error al enviar el email. Por favor verifica tu configuración de Resend.',
        details: emailResult.error?.message || 'Error desconocido'
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Código enviado' });
  } catch (error: any) {
    console.error("❌ Error general:", error);
    return NextResponse.json({ 
      error: 'Error al procesar la solicitud',
      details: error?.message || 'Error desconocido'
    }, { status: 500 });
  }
}
