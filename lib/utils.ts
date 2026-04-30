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

let beepCtx: AudioContext | null = null;
export function playBeep() {
  if (typeof window === 'undefined') return;
  try {
    if (!beepCtx) {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      beepCtx = new Ctx();
    }
    const o = beepCtx.createOscillator();
    const g = beepCtx.createGain();
    o.connect(g);
    g.connect(beepCtx.destination);
    o.type = 'sine';
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, beepCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, beepCtx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, beepCtx.currentTime + 0.4);
    o.start();
    o.stop(beepCtx.currentTime + 0.4);
  } catch {
    // autoplay policy o sin audio device — ignorar
  }
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffSec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (diffSec < 60) return 'hace unos segundos';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `hace ${diffHr} h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `hace ${diffDay} d`;
  return formatShortDate(d);
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
    // ✅ IMPORTANTE: Obtener hora actual en zona horaria de Argentina (America/Argentina/Buenos_Aires)
    // Vercel servers están en UTC, necesitamos convertir a hora local
    const now = new Date();
    
    // Convertir a hora de Argentina (UTC-3)
    const argentinaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
    
    // Crear fecha de hoy en formato YYYY-MM-DD
    const todayStr = `${argentinaTime.getFullYear()}-${String(argentinaTime.getMonth() + 1).padStart(2, '0')}-${String(argentinaTime.getDate()).padStart(2, '0')}`;
    
    console.log(`📅 Fecha seleccionada: ${selectedDate}`);
    console.log(`📅 Hoy (Argentina): ${todayStr}`);
    console.log(`📅 ¿Es HOY?: ${selectedDate === todayStr}`);
    
    if (selectedDate === todayStr) {
      // ✅ Es HOY - calcular hora mínima considerando buffer de tiempo
      const currentMinutes = argentinaTime.getHours() * 60 + argentinaTime.getMinutes();
      
      // ✅ Buffer de 30 minutos: el usuario necesita tiempo para confirmar la reserva
      const bufferMinutes = 30;
      const minimumStartTime = currentMinutes + bufferMinutes;
      
      // ✅ Calcular cuál es el primer slot que cumple con el tiempo mínimo
      // Ejemplo: Si son las 15:22 + 30min = 15:52 (952 minutos)
      // Y el servicio es cada 60 min (slots en minutos: 540, 600, 660, 720, 780, 840, 900, 960...)
      //                                                 09:00 10:00 11:00 12:00 13:00 14:00 15:00 16:00
      // Necesitamos encontrar el primer slot >= 952, que es 960 (16:00)
      
      let nextSlot = openMinutes;
      while (nextSlot < minimumStartTime && nextSlot < closeMinutes) {
        nextSlot += durationMinutes;
      }
      
      minStartTime = Math.max(openMinutes, nextSlot);
      
      console.log(`🕐 Reserva para HOY (Argentina)`);
      console.log(`   - Hora actual (Argentina): ${minutesToTime(currentMinutes)} (${currentMinutes} min)`);
      console.log(`   - Hora actual + buffer 30min: ${minutesToTime(minimumStartTime)} (${minimumStartTime} min)`);
      console.log(`   - Duración servicio: ${durationMinutes} min`);
      console.log(`   - Horario negocio: ${openTime} (${openMinutes} min) - ${closeTime} (${closeMinutes} min)`);
      console.log(`   - Primer slot >= mínimo: ${minutesToTime(minStartTime)} (${minStartTime} min)`);
    } else {
      console.log(`📅 Reserva para OTRO DÍA - Mostrando todos los horarios desde ${openTime}`);
    }
  }

  // ✅ Generar slots desde minStartTime hasta closeTime
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

  console.log(`✅ Total de slots generados: ${slots.length}, Primer slot: ${slots[0]?.start || 'ninguno'}, Último slot: ${slots[slots.length - 1]?.start || 'ninguno'}`);

  return slots;
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length >= 3 && slug.length <= 50;
}
