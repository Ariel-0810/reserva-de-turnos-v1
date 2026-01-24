import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateUniqueId(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Parse date without timezone conversion - treats date as local
function parseDateAsLocal(date: Date | string): Date {
  if (typeof date === 'string') {
    // If it's an ISO string like "2026-01-17T00:00:00.000Z", extract just the date part
    const dateStr = date.split('T')[0];
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  // If it's already a Date object, extract UTC date parts and create local date
  const d = new Date(date);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function formatDate(date: Date | string): string {
  const d = parseDateAsLocal(date);
  return d.toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatShortDate(date: Date | string): string {
  const d = parseDateAsLocal(date);
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatPrice(price: number | string): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(num);
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function generateTimeSlots(
  openTime: string,
  closeTime: string,
  durationMinutes: number,
  existingBookings: { startTime: string; endTime: string }[],
  selectedDate?: string // Formato: "YYYY-MM-DD"
): { start: string; end: string; available: boolean }[] {
  const slots: { start: string; end: string; available: boolean }[] = [];
  const openMinutes = timeToMinutes(openTime);
  const closeMinutes = timeToMinutes(closeTime);

  // ✅ Detectar si la fecha seleccionada es HOY
  let minStartTime = openMinutes;
  if (selectedDate) {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    if (selectedDate === todayStr) {
      // ✅ Es HOY - calcular hora mínima considerando buffer de tiempo
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      // ✅ Buffer de 30 minutos: el usuario necesita tiempo para confirmar la reserva
      const bufferMinutes = 30;
      const minimumStartTime = currentMinutes + bufferMinutes;
      
      // ✅ Redondear al próximo slot disponible
      // Si ahora son las 15:09 + 30min buffer = 15:39
      // Y los slots son cada 60 min → próximo slot: 16:00
      // Y los slots son cada 30 min → próximo slot: 16:00 (15:39 redondeado)
      const nextSlot = Math.ceil(minimumStartTime / durationMinutes) * durationMinutes;
      minStartTime = Math.max(openMinutes, nextSlot);
      
      console.log(`🕐 Reserva para HOY - Hora actual: ${minutesToTime(currentMinutes)}, Mínimo con buffer: ${minutesToTime(minimumStartTime)}, Próximo slot: ${minutesToTime(minStartTime)}`);
    }
  }

  // ✅ El incremento ahora usa la duración del servicio
  // Si el servicio dura 60 min, los slots serán cada 60 min (9:00, 10:00, 11:00...)
  // Si el servicio dura 30 min, los slots serán cada 30 min (9:00, 9:30, 10:00...)
  for (let start = minStartTime; start + durationMinutes <= closeMinutes; start += durationMinutes) {
    const end = start + durationMinutes;
    const startStr = minutesToTime(start);
    const endStr = minutesToTime(end);

    const isConflict = (existingBookings ?? []).some((booking) => {
      const bookingStart = timeToMinutes(booking?.startTime ?? '00:00');
      const bookingEnd = timeToMinutes(booking?.endTime ?? '00:00');
      return start < bookingEnd && end > bookingStart;
    });

    slots.push({ start: startStr, end: endStr, available: !isConflict });
  }

  return slots;
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length >= 3 && slug.length <= 50;
}
