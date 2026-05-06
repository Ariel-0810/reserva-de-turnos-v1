import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
//import { User, EmailVerification } from '@/lib/db';
import { User } from '@/lib/models/User';
import { EmailVerification } from '@/lib/models/EmailVerification';
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

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true, message: 'Si el email existe, recibirás un código' });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete old verification codes for this user
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
      subject: 'Recuperar contraseña - AgendUp',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">Recuperar contraseña</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña. Tu código de verificación es:</p>
        <div style="background-color: #f5f3ff; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; border: 2px solid #c4b5fd;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #7c3aed;">${code}</span>
        </div>
        <p style="color: #6b7280;">Este código expira en 15 minutos.</p>
        <p style="color: #6b7280;">Si no solicitaste recuperar tu contraseña, ignora este mensaje.</p>
      </div>`,
    });

    if (!emailResult.success) {
      console.error('❌ Error al enviar email de recuperación:', emailResult.error);
    }

    return NextResponse.json({ success: true, message: 'Código enviado' });
  } catch (error) {
    console.error('Error sending recovery code:', error);
    return NextResponse.json({ error: 'Error al enviar código' }, { status: 500 });
  }
}
