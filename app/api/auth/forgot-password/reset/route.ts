import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import { User } from '@/lib/models/User';
import { EmailVerification } from '@/lib/models/EmailVerification';
import { Op } from 'sequelize';
//import { User, EmailVerification, Op } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    await initDb();
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    // Find user by email
    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Código inválido o expirado' }, { status: 400 });
    }

    // Find valid verification code
    const verification = await EmailVerification.findOne({
      where: {
        userId: user.id,
        code,
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    if (!verification) {
      return NextResponse.json({ error: 'Código inválido o expirado' }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await User.update(
      { password: hashedPassword },
      { where: { id: user.id } }
    );

    // Delete used verification code
    await EmailVerification.destroy({
      where: { id: verification.id },
    });

    return NextResponse.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ error: 'Error al actualizar contraseña' }, { status: 500 });
  }
}
