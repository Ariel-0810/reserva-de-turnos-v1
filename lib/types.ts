import { UserRole, BookingStatus } from './emuns';

export type UserRole = typeof UserRole[keyof typeof UserRole];
export type BookingStatus = typeof BookingStatus[keyof typeof BookingStatus];

export interface UserData {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: UserRole;
}

export interface BusinessData {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface BusinessHoursData {
  id: string;
  businessId: string;
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface ServiceData {
  id: string;
  businessId: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: number | string;
  isActive: boolean;
}

export interface BookingData {
  id: string;
  businessId: string;
  serviceId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  bookingDate: Date | string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  uniqueId: string;
  createdAt: Date | string;
  service?: ServiceData;
  business?: BusinessData;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

export const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada'
};

export const STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-600'
};
