'use client';

import { useState, useEffect, useMemo } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { cn, formatShortDate, timeToMinutes } from '@/lib/utils';
import { STATUS_LABELS, BookingStatus } from '@/lib/types';
import toast from 'react-hot-toast';

interface BookingService {
  id: string;
  name: string;
}

interface Booking {
  id: string;
  uniqueId: string;
  customerName: string;
  customerPhone?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  service?: BookingService | null;
}

interface DayData {
  date: Date;
  bookings: Booking[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

type View = 'day' | 'week' | 'month';

const HOUR_START = 8;
const HOUR_END = 23;
const PX_PER_MINUTE = 1; // 60px por hora

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const dayNamesFull = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function bookingDateKey(b: Booking): string {
  return (b.bookingDate ?? '').split('T')[0];
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // Lunes como inicio (ISO): si es domingo (0), restar 6; sino restar (day-1)
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function getDaysOfWeek(date: Date): Date[] {
  const start = getStartOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function getStatusColor(status: BookingStatus): string {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-green-500';
    case 'PENDING':
      return 'bg-amber-500';
    case 'CANCELLED':
      return 'bg-red-300';
    default:
      return 'bg-gray-300';
  }
}

export function CalendarClient() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<BookingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [view, setView] = useState<View>('month');
  const [serviceFilter, setServiceFilter] = useState<string>('all');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings?status=all');
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar reservas');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      if (Array.isArray(data)) {
        setServices(data.map((s: any) => ({ id: s.id, name: s.name })));
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchServices();
  }, []);

  const filteredBookings = useMemo(() => {
    if (serviceFilter === 'all') return bookings;
    return bookings.filter((b) => b.service?.id === serviceFilter);
  }, [bookings, serviceFilter]);

  const visibleServices = useMemo(() => {
    if (serviceFilter === 'all') return services;
    return services.filter((s) => s.id === serviceFilter);
  }, [services, serviceFilter]);

  // ------- Vista Mes -------
  const monthDays = useMemo<DayData[]>(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();

    const days: DayData[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = startOffset - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, bookings: [], isCurrentMonth: false, isToday: false });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      const key = toLocalDateKey(date);
      const dayBookings = filteredBookings.filter((b) => bookingDateKey(b) === key);
      const isToday = date.getTime() === today.getTime();
      days.push({ date, bookings: dayBookings, isCurrentMonth: true, isToday });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, bookings: [], isCurrentMonth: false, isToday: false });
    }

    return days;
  }, [currentDate, filteredBookings]);

  // ------- Vistas Día / Semana — bookings por día -------
  const dayBookings = useMemo(() => {
    const key = toLocalDateKey(currentDate);
    return filteredBookings.filter((b) => bookingDateKey(b) === key);
  }, [currentDate, filteredBookings]);

  const weekDays = useMemo(() => getDaysOfWeek(currentDate), [currentDate]);

  const weekBookingsByDay = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    for (const d of weekDays) {
      map[toLocalDateKey(d)] = [];
    }
    for (const b of filteredBookings) {
      const key = bookingDateKey(b);
      if (key in map) map[key].push(b);
    }
    return map;
  }, [filteredBookings, weekDays]);

  // Hours range
  const hours = useMemo(() => {
    return Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
  }, []);
  const totalMinutes = (HOUR_END - HOUR_START) * 60;
  const totalPx = totalMinutes * PX_PER_MINUTE;

  // Posicionamiento de un bloque dentro del rango HOUR_START..HOUR_END
  const getBlockStyle = (b: Booking) => {
    const startMin = timeToMinutes(b.startTime);
    const endMin = timeToMinutes(b.endTime);
    const top = Math.max(0, (startMin - HOUR_START * 60) * PX_PER_MINUTE);
    const height = Math.max(20, (endMin - startMin) * PX_PER_MINUTE);
    return { top: `${top}px`, height: `${height}px` };
  };

  // ------- Navegación -------
  const goToPrev = () => {
    const d = new Date(currentDate);
    if (view === 'day') d.setDate(d.getDate() - 1);
    else if (view === 'week') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1, 1);
    setCurrentDate(d);
  };

  const goToNext = () => {
    const d = new Date(currentDate);
    if (view === 'day') d.setDate(d.getDate() + 1);
    else if (view === 'week') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1, 1);
    setCurrentDate(d);
  };

  const goToToday = () => setCurrentDate(new Date());

  // ------- Header label según vista -------
  const headerLabel = useMemo(() => {
    if (view === 'month') {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
    if (view === 'week') {
      const start = weekDays[0];
      const end = weekDays[6];
      const sameMonth = start.getMonth() === end.getMonth();
      const startStr = `${start.getDate()} ${monthNames[start.getMonth()].slice(0, 3)}`;
      const endStr = sameMonth
        ? `${end.getDate()} ${monthNames[end.getMonth()].slice(0, 3)}`
        : `${end.getDate()} ${monthNames[end.getMonth()].slice(0, 3)}`;
      return `${startStr} – ${endStr} ${end.getFullYear()}`;
    }
    return `${dayNamesFull[currentDate.getDay()]} ${currentDate.getDate()} de ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }, [view, currentDate, weekDays]);

  const todayKey = toLocalDateKey(new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
          <CalendarDays className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
          <p className="text-sm text-gray-500">
            {view === 'day' ? 'Vista diaria por servicio' : view === 'week' ? 'Vista semanal' : 'Vista mensual'}
          </p>
        </div>
      </div>

      {/* Toggle vistas + filtro servicio */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-2">
          {(['day', 'week', 'month'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                view === v
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              )}
            >
              {v === 'day' ? 'Día' : v === 'week' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>

        {/* Filtro por servicio (visible siempre que haya servicios) */}
        {services.length > 0 && (
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            >
              <option value="all">Todos los servicios</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          {/* Header navegación */}
          <div className="flex items-center justify-between mb-6 gap-2">
            <Button variant="ghost" size="sm" onClick={goToPrev} aria-label="Anterior">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 text-center">
                {headerLabel}
              </h2>
              <button
                onClick={goToToday}
                className="px-2 py-1 text-xs text-violet-600 hover:bg-violet-50 rounded-md"
              >
                Hoy
              </button>
            </div>
            <Button variant="ghost" size="sm" onClick={goToNext} aria-label="Siguiente">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {loading ? (
            <div className="py-20 text-center text-gray-500">Cargando...</div>
          ) : view === 'month' ? (
            <MonthView
              days={monthDays}
              onDayClick={(day) => (day.bookings.length > 0 ? setSelectedDay(day) : null)}
            />
          ) : view === 'week' ? (
            <WeekView
              weekDays={weekDays}
              bookingsByDay={weekBookingsByDay}
              hours={hours}
              totalPx={totalPx}
              getBlockStyle={getBlockStyle}
              todayKey={todayKey}
              onBookingClick={setSelectedBooking}
            />
          ) : (
            <DayView
              services={visibleServices}
              bookings={dayBookings}
              hours={hours}
              totalPx={totalPx}
              getBlockStyle={getBlockStyle}
              onBookingClick={setSelectedBooking}
            />
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-500" />
              <span className="text-xs text-gray-600">Pendiente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-xs text-gray-600">Confirmada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-300" />
              <span className="text-xs text-gray-600 line-through opacity-80">Cancelada</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de día (vista mes) */}
      <Modal
        isOpen={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? `Reservas del ${formatShortDate(selectedDay.date)}` : ''}
        size="md"
      >
        {selectedDay && (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {selectedDay.bookings.map((booking) => (
              <button
                key={booking.id}
                onClick={() => {
                  setSelectedBooking(booking);
                  setSelectedDay(null);
                }}
                className="w-full bg-gray-50 hover:bg-gray-100 rounded-xl p-4 flex items-center justify-between text-left"
              >
                <div>
                  <p className="font-medium text-gray-900">{booking.customerName}</p>
                  <p className="text-sm text-gray-600">
                    {booking.service?.name} • {booking.startTime} - {booking.endTime}
                  </p>
                </div>
                <Badge
                  variant={
                    booking.status === 'CONFIRMED'
                      ? 'success'
                      : booking.status === 'PENDING'
                      ? 'warning'
                      : 'default'
                  }
                >
                  {STATUS_LABELS[booking.status]}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </Modal>

      {/* Modal de detalle de booking (click sobre un bloque en día/semana) */}
      <Modal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title="Detalle de Reserva"
        size="md"
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded">
                #{selectedBooking.uniqueId}
              </span>
              <Badge
                variant={
                  selectedBooking.status === 'CONFIRMED'
                    ? 'success'
                    : selectedBooking.status === 'PENDING'
                    ? 'warning'
                    : 'destructive'
                }
              >
                {STATUS_LABELS[selectedBooking.status]}
              </Badge>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Cliente</p>
                <p className="font-medium text-gray-900">{selectedBooking.customerName}</p>
              </div>
              {selectedBooking.customerPhone && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Teléfono</p>
                  <p className="font-medium text-gray-900">{selectedBooking.customerPhone}</p>
                </div>
              )}
            </div>

            <div className="bg-violet-50 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-xs text-violet-600 uppercase tracking-wide">Servicio</p>
                <p className="font-medium text-gray-900">{selectedBooking.service?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-violet-600 uppercase tracking-wide">Fecha</p>
                <p className="font-medium text-gray-900">
                  {formatShortDate(selectedBooking.bookingDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-violet-600 uppercase tracking-wide">Horario</p>
                <p className="font-medium text-gray-900">
                  {selectedBooking.startTime} - {selectedBooking.endTime}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ============ Subcomponentes de vista ============

function MonthView({
  days,
  onDayClick,
}: {
  days: DayData[];
  onDayClick: (day: DayData) => void;
}) {
  return (
    <>
      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => (
          <button
            key={idx}
            onClick={() => onDayClick(day)}
            className={cn(
              'min-h-[80px] p-2 rounded-lg text-left transition-all',
              day.isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50',
              day.isToday && 'ring-2 ring-violet-500',
              day.bookings.length > 0 && 'cursor-pointer'
            )}
          >
            <span
              className={cn(
                'text-sm font-medium',
                day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400',
                day.isToday && 'text-violet-600'
              )}
            >
              {day.date.getDate()}
            </span>
            {day.bookings.length > 0 && (
              <div className="mt-1 space-y-1">
                {day.bookings.slice(0, 3).map((b) => (
                  <div
                    key={b.id}
                    className={cn(
                      'w-full px-1 py-0.5 rounded text-[9px] sm:text-[10px] font-medium truncate text-white',
                      getStatusColor(b.status),
                      b.status === 'CANCELLED' && 'line-through opacity-80'
                    )}
                    title={`${b.startTime} • ${b.service?.name ?? ''} • ${STATUS_LABELS[b.status] ?? ''}`}
                  >
                    {b.startTime} {b.service?.name ?? '—'}
                  </div>
                ))}
                {day.bookings.length > 3 && (
                  <p className="text-[10px] text-gray-500">+{day.bookings.length - 3} más</p>
                )}
              </div>
            )}
          </button>
        ))}
      </div>
    </>
  );
}

function HoursColumn({ hours, totalPx }: { hours: number[]; totalPx: number }) {
  return (
    <div className="relative w-12 sm:w-14 flex-shrink-0" style={{ height: `${totalPx}px` }}>
      {hours.map((h) => (
        <div
          key={h}
          className="absolute left-0 right-0 border-t border-gray-100 text-[10px] sm:text-xs text-gray-400 pl-1"
          style={{ top: `${(h - HOUR_START) * 60 * PX_PER_MINUTE}px`, height: `${60 * PX_PER_MINUTE}px` }}
        >
          {String(h).padStart(2, '0')}:00
        </div>
      ))}
    </div>
  );
}

function DayView({
  services,
  bookings,
  hours,
  totalPx,
  getBlockStyle,
  onBookingClick,
}: {
  services: BookingService[];
  bookings: Booking[];
  hours: number[];
  totalPx: number;
  getBlockStyle: (b: Booking) => { top: string; height: string };
  onBookingClick: (b: Booking) => void;
}) {
  if (services.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        Aún no tenés servicios cargados. Creá uno en "Servicios".
      </div>
    );
  }

  // Bookings sin servicio asignado se ignoran en vista día (se ven en mensual y semanal)
  const bookingsByService: Record<string, Booking[]> = {};
  for (const s of services) bookingsByService[s.id] = [];
  for (const b of bookings) {
    if (b.service?.id && bookingsByService[b.service.id]) {
      bookingsByService[b.service.id].push(b);
    }
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-fit">
        <HoursColumn hours={hours} totalPx={totalPx} />

        {services.map((s) => (
          <div key={s.id} className="flex-1 min-w-[140px] border-l border-gray-100">
            {/* Header de columna */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-2 py-2 text-center">
              <p className="text-xs sm:text-sm font-semibold text-gray-700 truncate">{s.name}</p>
            </div>
            <div className="relative" style={{ height: `${totalPx}px` }}>
              {/* Grid lines por hora */}
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-gray-100"
                  style={{ top: `${(h - HOUR_START) * 60 * PX_PER_MINUTE}px` }}
                />
              ))}

              {/* Bloques de reservas */}
              {(bookingsByService[s.id] ?? []).map((b) => (
                <button
                  key={b.id}
                  onClick={() => onBookingClick(b)}
                  className={cn(
                    'absolute left-1 right-1 px-2 py-1 rounded text-[10px] sm:text-xs text-white text-left overflow-hidden shadow-sm hover:shadow-md transition-all',
                    getStatusColor(b.status),
                    b.status === 'CANCELLED' && 'line-through opacity-80'
                  )}
                  style={getBlockStyle(b)}
                  title={`${b.customerName} • ${b.startTime}-${b.endTime} • ${STATUS_LABELS[b.status]}`}
                >
                  <div className="font-semibold truncate">{b.startTime}–{b.endTime}</div>
                  <div className="truncate">{b.customerName}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekView({
  weekDays,
  bookingsByDay,
  hours,
  totalPx,
  getBlockStyle,
  todayKey,
  onBookingClick,
}: {
  weekDays: Date[];
  bookingsByDay: Record<string, Booking[]>;
  hours: number[];
  totalPx: number;
  getBlockStyle: (b: Booking) => { top: string; height: string };
  todayKey: string;
  onBookingClick: (b: Booking) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-fit">
        <HoursColumn hours={hours} totalPx={totalPx} />

        {weekDays.map((d) => {
          const key = toLocalDateKey(d);
          const dayBookings = bookingsByDay[key] ?? [];
          const isToday = key === todayKey;

          return (
            <div key={key} className="flex-1 min-w-[110px] border-l border-gray-100">
              <div
                className={cn(
                  'sticky top-0 bg-white border-b border-gray-100 px-2 py-2 text-center',
                  isToday && 'bg-violet-50'
                )}
              >
                <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase">
                  {dayNames[d.getDay()]}
                </p>
                <p
                  className={cn(
                    'text-base font-semibold',
                    isToday ? 'text-violet-600' : 'text-gray-700'
                  )}
                >
                  {d.getDate()}
                </p>
              </div>
              <div className="relative" style={{ height: `${totalPx}px` }}>
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-gray-100"
                    style={{ top: `${(h - HOUR_START) * 60 * PX_PER_MINUTE}px` }}
                  />
                ))}

                {dayBookings.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => onBookingClick(b)}
                    className={cn(
                      'absolute left-0.5 right-0.5 px-1.5 py-1 rounded text-[10px] text-white text-left overflow-hidden shadow-sm hover:shadow-md transition-all',
                      getStatusColor(b.status),
                      b.status === 'CANCELLED' && 'line-through opacity-80'
                    )}
                    style={getBlockStyle(b)}
                    title={`${b.customerName} • ${b.startTime}-${b.endTime} • ${b.service?.name ?? ''} • ${STATUS_LABELS[b.status]}`}
                  >
                    <div className="font-semibold truncate">{b.startTime}</div>
                    <div className="truncate">{b.service?.name ?? b.customerName}</div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
