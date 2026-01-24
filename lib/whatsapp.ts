// WhatsApp Link Generator utilities
// These functions generate wa.me links that open WhatsApp with pre-filled messages

export interface WhatsAppBookingParams {
  businessName: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  uniqueId: string;
  publicBookingUrl?: string;
}

/**
 * Normalizes a phone number for WhatsApp link
 * Removes all non-numeric characters and ensures correct format
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-numeric characters (including +, spaces, dashes, etc.)
  let normalized = phone.replace(/\D/g, '');
  
  // Si el número no empieza con 549 para Argentina, intentar arreglarlo
  // Esto maneja casos donde el número está mal guardado
  if (normalized.length >= 10) {
    // Si empieza con 54 pero no con 549, agregar el 9
    if (normalized.startsWith('54') && !normalized.startsWith('549')) {
      // Verificar si el siguiente dígito es 9 (celular argentino)
      // Si no, agregar el 9 entre el 54 y el resto
      const rest = normalized.substring(2);
      if (rest.startsWith('11') || rest.startsWith('9')) {
        // Es un celular de CABA o ya tiene el 9
        normalized = '549' + rest;
      }
    }
    // Si empieza con 9 solamente (falta el 54)
    else if (normalized.startsWith('9') && normalized.length === 12) {
      normalized = '54' + normalized;
    }
    // Si no empieza con 54 pero tiene 10 dígitos (solo número local)
    else if (!normalized.startsWith('54') && normalized.length === 10) {
      normalized = '549' + normalized;
    }
  }
  
  return normalized;
}

/**
 * Generates a WhatsApp link with a pre-filled message
 */
export function generateWhatsAppLink(phone: string, message: string): string {
  const normalizedPhone = normalizePhoneNumber(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
}

/**
 * Generates confirmation message for WhatsApp
 */
export function getWhatsAppConfirmationMessage(params: WhatsAppBookingParams): string {
  const { businessName, customerName, serviceName, bookingDate, startTime, endTime, uniqueId, publicBookingUrl } = params;
  
  let message = `✅ *¡Tu reserva ha sido CONFIRMADA!*\n\n`;
  message += `Hola ${customerName}, tu reserva en *${businessName}* ha sido confirmada.\n\n`;
  message += `📋 *Detalles de tu reserva:*\n`;
  message += `• ID: ${uniqueId}\n`;
  message += `• Servicio: ${serviceName}\n`;
  message += `• Fecha: ${bookingDate}\n`;
  message += `• Horario: ${startTime} - ${endTime}\n\n`;
  message += `¡Te esperamos! 🙌`;
  
  if (publicBookingUrl) {
    message += `\n\n📌 *¿Necesitas cancelar?*\nIngresa tu ID de reserva (${uniqueId}) en:\n${publicBookingUrl}`;
  }
  
  return message;
}

/**
 * Generates cancellation message for WhatsApp
 */
export function getWhatsAppCancellationMessage(params: WhatsAppBookingParams): string {
  const { businessName, customerName, serviceName, bookingDate, startTime, endTime, uniqueId } = params;
  
  let message = `❌ *Tu reserva ha sido CANCELADA*\n\n`;
  message += `Hola ${customerName}, lamentamos informarte que tu reserva en *${businessName}* ha sido cancelada.\n\n`;
  message += `📋 *Detalles de la reserva cancelada:*\n`;
  message += `• ID: ${uniqueId}\n`;
  message += `• Servicio: ${serviceName}\n`;
  message += `• Fecha: ${bookingDate}\n`;
  message += `• Horario: ${startTime} - ${endTime}\n\n`;
  message += `Si tienes alguna consulta, no dudes en contactarnos.`;
  
  return message;
}

/**
 * Opens WhatsApp with a pre-filled message
 * Returns true if the link was opened, false if there's no customer phone
 */
export function openWhatsAppForBooking(
  customerPhone: string,
  message: string
): boolean {
  if (!customerPhone) return false;
  
  const link = generateWhatsAppLink(customerPhone, message);
  window.open(link, '_blank');
  return true;
}

/**
 * Generates message for customer to notify business owner about cancellation
 */
export function getWhatsAppCustomerCancellationToOwnerMessage(params: WhatsAppBookingParams): string {
  const { businessName, customerName, serviceName, bookingDate, startTime, endTime, uniqueId, customerPhone } = params;
  
  let message = `❌ *Cancelación de Reserva*\n\n`;
  message += `Hola, te informo que he cancelado mi reserva en *${businessName}*.\n\n`;
  message += `📋 *Detalles de la reserva cancelada:*\n`;
  message += `• ID: ${uniqueId}\n`;
  message += `• Servicio: ${serviceName}\n`;
  message += `• Fecha: ${bookingDate}\n`;
  message += `• Horario: ${startTime} - ${endTime}\n\n`;
  message += `👤 *Mis datos:*\n`;
  message += `• Nombre: ${customerName}\n`;
  message += `• Teléfono: ${customerPhone}\n\n`;
  message += `Disculpa las molestias.`;
  
  return message;
}
