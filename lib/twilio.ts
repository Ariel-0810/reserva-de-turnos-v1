// Twilio WhatsApp Integration
// This module handles WhatsApp notifications via Twilio API

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  whatsappNumber: string;
}

const getTwilioConfig = (): TwilioConfig | null => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !whatsappNumber) {
    return null;
  }

  return { accountSid, authToken, whatsappNumber };
};

export const isTwilioConfigured = (): boolean => {
  return getTwilioConfig() !== null;
};

export const sendWhatsAppMessage = async (
  to: string,
  message: string
): Promise<{ success: boolean; error?: string }> => {
  const config = getTwilioConfig();

  if (!config) {
    console.log('Twilio not configured, skipping WhatsApp message');
    return { success: false, error: 'Twilio no configurado' };
  }

  try {
    // Format phone number for WhatsApp (must include country code)
    const formattedTo = to.startsWith('+') ? to : `+${to}`;
    const whatsappTo = `whatsapp:${formattedTo}`;
    const whatsappFrom = `whatsapp:${config.whatsappNumber}`;

    // Twilio API endpoint
    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' +
          Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64'),
      },
      body: new URLSearchParams({
        To: whatsappTo,
        From: whatsappFrom,
        Body: message,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Twilio API error:', error);
      return { success: false, error: 'Error al enviar mensaje de WhatsApp' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return { success: false, error: 'Error de conexión con Twilio' };
  }
};

// Template messages for bookings
export const getBookingConfirmationMessage = (
  businessName: string,
  serviceName: string,
  date: string,
  time: string,
  bookingId: string
): string => {
  return `✅ *Reserva Confirmada*

📍 ${businessName}
🛎️ Servicio: ${serviceName}
📅 Fecha: ${date}
⏰ Horario: ${time}

🎫 ID de reserva: ${bookingId}

¡Te esperamos!`;
};

export const getBookingCancellationMessage = (
  businessName: string,
  serviceName: string,
  date: string,
  time: string
): string => {
  return `❌ *Reserva Cancelada*

📍 ${businessName}
🛎️ Servicio: ${serviceName}
📅 Fecha: ${date}
⏰ Horario: ${time}

Si tienes alguna consulta, contáctanos.`;
};
