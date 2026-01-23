import { NextRequest, NextResponse } from 'next/server';
//import { User, EmailVerification, Op } from '@/lib/db';
import { initDb } from '@/lib/db';
import { User } from '@/lib/models/User';
import { EmailVerification } from '@/lib/models/EmailVerification';
import { Op } from 'sequelize';
export async function POST(req: NextRequest) {
  try {
    await initDb();
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email y código requeridos' }, { status: 400 });
    }

    // Find user by email
    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Find verification code
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

    // Mark email as verified
    await User.update(
      { isEmailVerified: true },
      { where: { id: user.id } }
    );

    // Delete all verification codes for this user
    await EmailVerification.destroy({
      where: { userId: user.id },
    });

    return NextResponse.json({ success: true, message: 'Email verificado correctamente' });
  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json({ error: 'Error al verificar código' }, { status: 500 });
  }
}
