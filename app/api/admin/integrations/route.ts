export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { SystemConfig, Op } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const configs = await SystemConfig.findAll({
      where: {
        key: { [Op.in]: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_NUMBER'] },
      },
    });

    const configMap: Record<string, string> = {};
    (configs ?? []).forEach((c) => {
      configMap[c?.key ?? ''] = c?.value ?? '';
    });

    return NextResponse.json({
      twilioAccountSid: configMap?.['TWILIO_ACCOUNT_SID'] ?? '',
      twilioAuthToken: configMap?.['TWILIO_AUTH_TOKEN'] ? '********' : '',
      twilioWhatsappNumber: configMap?.['TWILIO_WHATSAPP_NUMBER'] ?? '',
    });
  } catch (error) {
    console.error('GET integrations error:', error);
    return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { twilioAccountSid, twilioAuthToken, twilioWhatsappNumber } = body ?? {};

    const updates = [
      { key: 'TWILIO_ACCOUNT_SID', value: twilioAccountSid ?? '' },
      { key: 'TWILIO_AUTH_TOKEN', value: twilioAuthToken ?? '' },
      { key: 'TWILIO_WHATSAPP_NUMBER', value: twilioWhatsappNumber ?? '' },
    ];

    for (const { key, value } of updates) {
      if (value && value !== '********') {
        const [config, created] = await SystemConfig.findOrCreate({
          where: { key },
          defaults: { key, value },
        });
        if (!created) {
          await config.update({ value });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT integrations error:', error);
    return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 });
  }
}
