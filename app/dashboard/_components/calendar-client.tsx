'use client';

import { useState, useEffect } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { cn, formatShortDate } from '@/lib/utils';
import { STATUS_LABELS, BookingStatus } from '@/lib/types';
import toast from 'react-hot-toast';

interface Booking {
  id: string;
  uniqueId: string;
  customerName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  service?: { name: string } | null;
}

interface DayData {
  date: Date;
  bookings: Booking[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

export function CalendarClient() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

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

  useEffect(() => {
    fetchBookings();
  }, []);

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();

    const days: DayData[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Previous month days
    for (let i = startOffset - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, bookings: [], isCurrentMonth: false, isToday: false });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      const dateStr = date.toISOString().split('T')[0];
      const dayBookings = (bookings ?? []).filter((b) => {
        const bDate = new Date(b?.bookingDate);
        return bDate.toISOString().split('T')[0] === dateStr;
      });
      const isToday = date.getTime() === today.getTime();
      days.push({ date, bookings: dayBookings, isCurrentMonth: true, isToday });
    }

    // Next month days to complete grid
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, bookings: [], isCurrentMonth: false, isToday: false });
    }

    return days;
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const goToPrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-500';
      case 'PENDING': return 'bg-amber-500';
      case 'CANCELLED': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const days = getDaysInMonth();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
          <CalendarDays className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
          <p className="text-sm text-gray-500">Vista mensual de tus reservas</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" onClick={goToPrevMonth}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button variant="ghost" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {loading ? (
            <div className="py-20 text-center text-gray-500">Cargando...</div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, idx) => (
                <button
                  key={idx}
                  onClick={() => (day?.bookings?.length ?? 0) > 0 && setSelectedDay(day)}
                  className={cn(
                    'min-h-[80px] p-2 rounded-lg text-left transition-all',
                    day?.isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50',
                    day?.isToday && 'ring-2 ring-violet-500',
                    (day?.bookings?.length ?? 0) > 0 && 'cursor-pointer'
                  )}
                >
                  <span
                    className={cn(
                      'text-sm font-medium',
                      day?.isCurrentMonth ? 'text-gray-900' : 'text-gray-400',
                      day?.isToday && 'text-violet-600'
                    )}
                  >
                    {day?.date?.getDate()}
                  </span>
                  {(day?.bookings?.length ?? 0) > 0 && (
                    <div className="mt-1 space-y-1">
                      {(day?.bookings ?? []).slice(0, 3).map((b) => (
                        <div
                          key={b?.id}
                          className={cn('w-full h-1.5 rounded', getStatusColor(b?.status))}
                        />
                      ))}
                      {(day?.bookings?.length ?? 0) > 3 && (
                        <p className="text-[10px] text-gray-500">+{(day?.bookings?.length ?? 0) - 3} más</p>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-500" />
              <span className="text-xs text-gray-600">Pendiente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-xs text-gray-600">Confirmada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gray-400" />
              <span className="text-xs text-gray-600">Cancelada</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day Detail Modal */}
      <Modal
        isOpen={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? `Reservas del ${formatShortDate(selectedDay?.date)}` : ''}
        size="md"
      >
        {selectedDay && (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {(selectedDay?.bookings ?? []).map((booking) => (
              <div
                key={booking?.id}
                className="bg-gray-50 rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{booking?.customerName}</p>
                  <p className="text-sm text-gray-600">
                    {booking?.service?.name} • {booking?.startTime} - {booking?.endTime}
                  </p>
                </div>
                <Badge
                  variant={
                    booking?.status === 'CONFIRMED'
                      ? 'success'
                      : booking?.status === 'PENDING'
                      ? 'warning'
                      : 'default'
                  }
                >
                  {STATUS_LABELS[booking?.status]}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
