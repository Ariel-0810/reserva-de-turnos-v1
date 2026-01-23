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
 * Removes all non-numeric characters except leading +
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-numeric characters except +
  let normalized = phone.replace(/[^0-9+]/g, '');
  // Remove + if present (wa.me doesn't need it)
  normalized = normalized.replace(/^\+/, '');
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
