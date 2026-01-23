import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({
  to,
  subject,
  html,
}: EmailParams): Promise<{ success: boolean; error?: any }> {
  try {
    console.log("📧 Intentando enviar email a:", to);
    console.log("📧 Desde:", "BookingSaaS <noreply@bookingsaas.app>");
    console.log("📧 API Key presente:", !!process.env.RESEND_API_KEY);
    
    const result = await resend.emails.send({
      from: "BookingSaaS <noreply@bookingsaas.app>",
      to,
      subject,
      html,
    });

    console.log("✅ Email enviado exitosamente:", result);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Error al enviar email:", error);
    console.error("❌ Detalles del error:", JSON.stringify(error, null, 2));
    return { success: false, error };
  }
}

export function verifyEmailTemplate({
  name,
  code,
}: {
  name: string;
  code: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif;">
      <h2>Hola ${name} 👋</h2>
      <p>Tu código de verificación es:</p>
      <h1 style="letter-spacing: 3px;">${code}</h1>
      <p>Este código vence en 15 minutos.</p>
    </div>
  `;
}


export function newBookingEmailToOwner(params: {
  businessName: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  serviceName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  uniqueId: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #7c3aed; border-bottom: 3px solid #8b5cf6; padding-bottom: 10px;">
        📅 Nueva Reserva en ${params?.businessName ?? 'tu negocio'}
      </h2>
      <div style="background: #f5f3ff; padding: 20px; border-radius: 12px; margin: 20px 0;">
        <p style="margin: 10px 0;"><strong>ID de Reserva:</strong> ${params?.uniqueId ?? ''}</p>
        <p style="margin: 10px 0;"><strong>Servicio:</strong> ${params?.serviceName ?? ''}</p>
        <p style="margin: 10px 0;"><strong>Fecha:</strong> ${params?.bookingDate ?? ''}</p>
        <p style="margin: 10px 0;"><strong>Horario:</strong> ${params?.startTime ?? ''} - ${params?.endTime ?? ''}</p>
        <hr style="border: 1px solid #c4b5fd; margin: 15px 0;">
        <p style="margin: 10px 0;"><strong>Cliente:</strong> ${params?.customerName ?? ''}</p>
        <p style="margin: 10px 0;"><strong>Teléfono:</strong> ${params?.customerPhone ?? ''}</p>
        ${params?.customerEmail ? `<p style="margin: 10px 0;"><strong>Email:</strong> ${params.customerEmail}</p>` : ''}
      </div>
      <p style="color: #666; font-size: 14px;">Ingresa a tu dashboard para confirmar o gestionar esta reserva.</p>
    </div>
  `;
}

export function bookingConfirmedEmailToCustomer(params: {
  businessName: string;
  customerName: string;
  serviceName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  uniqueId: string;
  businessAddress?: string | null;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #15803d; border-bottom: 3px solid #22c55e; padding-bottom: 10px;">
        ✅ ¡Tu reserva ha sido confirmada!
      </h2>
      <p style="font-size: 16px;">Hola ${params?.customerName ?? ''}, tu reserva en <strong>${params?.businessName ?? ''}</strong> ha sido confirmada.</p>
      <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin: 20px 0;">
        <p style="margin: 10px 0;"><strong>ID de Reserva:</strong> ${params?.uniqueId ?? ''}</p>
        <p style="margin: 10px 0;"><strong>Servicio:</strong> ${params?.serviceName ?? ''}</p>
        <p style="margin: 10px 0;"><strong>Fecha:</strong> ${params?.bookingDate ?? ''}</p>
        <p style="margin: 10px 0;"><strong>Horario:</strong> ${params?.startTime ?? ''} - ${params?.endTime ?? ''}</p>
        ${params?.businessAddress ? `<p style="margin: 10px 0;"><strong>Dirección:</strong> ${params.businessAddress}</p>` : ''}
      </div>
      <p style="color: #666; font-size: 14px;">¡Te esperamos!</p>
    </div>
  `;
}

export function bookingCancelledEmailToCustomer(params: {
  businessName: string;
  customerName: string;
  serviceName: string;
  bookingDate: string;
  startTime: string;
  uniqueId: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #dc2626; border-bottom: 3px solid #f87171; padding-bottom: 10px;">
        ❌ Tu reserva ha sido cancelada
      </h2>
      <p style="font-size: 16px;">Hola ${params?.customerName ?? ''}, lamentamos informarte que tu reserva en <strong>${params?.businessName ?? ''}</strong> ha sido cancelada.</p>
      <div style="background: #fef2f2; padding: 20px; border-radius: 12px; margin: 20px 0;">
        <p style="margin: 10px 0;"><strong>ID de Reserva:</strong> ${params?.uniqueId ?? ''}</p>
        <p style="margin: 10px 0;"><strong>Servicio:</strong> ${params?.serviceName ?? ''}</p>
        <p style="margin: 10px 0;"><strong>Fecha:</strong> ${params?.bookingDate ?? ''}</p>
        <p style="margin: 10px 0;"><strong>Horario:</strong> ${params?.startTime ?? ''}</p>
      </div>
      <p style="color: #666; font-size: 14px;">Si tienes alguna consulta, contacta al negocio directamente.</p>
    </div>
  `;
}

export function bookingCancelledByCustomerEmailToOwner(params: {
  businessName: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  serviceName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  uniqueId: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #dc2626; border-bottom: 3px solid #f87171; padding-bottom: 10px;">
        ❌ Reserva Cancelada por el Cliente
      </h2>
      <p style="font-size: 16px;">Un cliente ha cancelado su reserva en <strong>${params?.businessName ?? 'tu negocio'}</strong>.</p>
      <div style="background: #fef2f2; padding: 20px; border-radius: 12px; margin: 20px 0;">
        <p style="margin: 10px 0;"><strong>ID de Reserva:</strong> ${params?.uniqueId ?? ''}</p>
        <p style="margin: 10px 0;"><strong>Servicio:</strong> ${params?.serviceName ?? ''}</p>
        <p style="margin: 10px 0;"><strong>Fecha:</strong> ${params?.bookingDate ?? ''}</p>
        <p style="margin: 10px 0;"><strong>Horario:</strong> ${params?.startTime ?? ''} - ${params?.endTime ?? ''}</p>
        <hr style="border: 1px solid #fca5a5; margin: 15px 0;">
        <p style="margin: 10px 0;"><strong>Cliente:</strong> ${params?.customerName ?? ''}</p>
        <p style="margin: 10px 0;"><strong>Teléfono:</strong> ${params?.customerPhone ?? ''}</p>
        ${params?.customerEmail ? `<p style="margin: 10px 0;"><strong>Email:</strong> ${params.customerEmail}</p>` : ''}
      </div>
      <p style="color: #15803d; font-size: 14px; background: #f0fdf4; padding: 12px; border-radius: 8px;">
        ✅ El horario ${params?.startTime ?? ''} - ${params?.endTime ?? ''} del ${params?.bookingDate ?? ''} ha quedado disponible nuevamente para nuevas reservas.
      </p>
    </div>
  `;
}

export function newBusinessRegistrationEmailToSuperadmin(params: {
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string | null;
  businessName: string;
  businessSlug: string;
  registrationDate: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #7c3aed; border-bottom: 3px solid #8b5cf6; padding-bottom: 10px;">
        🎉 Nuevo Negocio Registrado
      </h2>
      <p style="font-size: 16px;">¡Un nuevo negocio se ha registrado en tu plataforma BookingSaaS!</p>
      <div style="background: #f5f3ff; padding: 20px; border-radius: 12px; margin: 20px 0;">
        <h3 style="color: #7c3aed; margin-top: 0;">📋 Datos del Negocio</h3>
        <p style="margin: 10px 0;"><strong>Nombre del negocio:</strong> ${params?.businessName ?? ''}</p>
        <p style="margin: 10px 0;"><strong>URL de reservas:</strong> /booking/${params?.businessSlug ?? ''}</p>
        <hr style="border: 1px solid #c4b5fd; margin: 15px 0;">
        <h3 style="color: #7c3aed; margin-top: 0;">👤 Datos del Propietario</h3>
        <p style="margin: 10px 0;"><strong>Nombre:</strong> ${params?.ownerName ?? ''}</p>
        <p style="margin: 10px 0;"><strong>Email:</strong> ${params?.ownerEmail ?? ''}</p>
        ${params?.ownerPhone ? `<p style="margin: 10px 0;"><strong>Teléfono:</strong> ${params.ownerPhone}</p>` : ''}
        <hr style="border: 1px solid #c4b5fd; margin: 15px 0;">
        <p style="margin: 10px 0; color: #6b7280;"><strong>Fecha de registro:</strong> ${params?.registrationDate ?? ''}</p>
      </div>
      <p style="color: #666; font-size: 14px;">Puedes gestionar este negocio desde el panel de superadmin.</p>
    </div>
  `;
}
