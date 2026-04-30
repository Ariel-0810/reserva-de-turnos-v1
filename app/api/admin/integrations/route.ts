export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { SystemConfig, Op } from '@/lib/db';

const TWILIO_KEYS = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_NUMBER'];
const MP_KEYS = ['mp.accessToken', 'mp.publicKey'];
const PLAN_KEYS = ['plan.defaultPrice'];
const ALL_KEYS = [...TWILIO_KEYS, ...MP_KEYS, ...PLAN_KEYS];

const SECRET_KEYS = new Set(['TWILIO_AUTH_TOKEN', 'mp.accessToken']);
const MASK_PLACEHOLDER = '********';

function maskValue(value: string): string {
  if (!value) return '';
  if (value.length <= 4) return MASK_PLACEHOLDER;
  return `${MASK_PLACEHOLDER}${value.slice(-4)}`;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const configs = await SystemConfig.findAll({
      where: { key: { [Op.in]: ALL_KEYS } },
    });

    const map: Record<string, string> = {};
    (configs ?? []).forEach((c) => {
      map[c?.key ?? ''] = c?.value ?? '';
    });

    return NextResponse.json({
      twilioAccountSid: map['TWILIO_ACCOUNT_SID'] ?? '',
      twilioAuthToken: map['TWILIO_AUTH_TOKEN'] ? maskValue(map['TWILIO_AUTH_TOKEN']) : '',
      twilioWhatsappNumber: map['TWILIO_WHATSAPP_NUMBER'] ?? '',
      mpAccessToken: map['mp.accessToken'] ? maskValue(map['mp.accessToken']) : '',
      mpPublicKey: map['mp.publicKey'] ?? '',
      planDefaultPrice: map['plan.defaultPrice'] ?? '',
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
    const {
      twilioAccountSid,
      twilioAuthToken,
      twilioWhatsappNumber,
      mpAccessToken,
      mpPublicKey,
      planDefaultPrice,
    } = body ?? {};

    const updates: { key: string; value: string }[] = [
      { key: 'TWILIO_ACCOUNT_SID', value: twilioAccountSid ?? '' },
      { key: 'TWILIO_AUTH_TOKEN', value: twilioAuthToken ?? '' },
      { key: 'TWILIO_WHATSAPP_NUMBER', value: twilioWhatsappNumber ?? '' },
      { key: 'mp.accessToken', value: mpAccessToken ?? '' },
      { key: 'mp.publicKey', value: mpPublicKey ?? '' },
      { key: 'plan.defaultPrice', value: planDefaultPrice ?? '' },
    ];

    for (const { key, value } of updates) {
      // Skip masked secret values (no overwrite con el placeholder)
      if (SECRET_KEYS.has(key) && (value === '' || value.startsWith(MASK_PLACEHOLDER))) {
        continue;
      }
      const [config, created] = await SystemConfig.findOrCreate({
        where: { key },
        defaults: { key, value },
      });
      if (!created) {
        await config.update({ value });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT integrations error:', error);
    return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 });
  }
}
