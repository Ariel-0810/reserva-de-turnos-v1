'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatShortDate } from '@/lib/utils';
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
  business?: { name: string; slug: string } | null;
}

interface Business {
  id: string;
  name: string;
}

const statusFilters = [
  { value: 'all', label: 'Todas' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'CONFIRMED', label: 'Confirmadas' },
  { value: 'CANCELLED', label: 'Canceladas' },
];

export function AdminBookingsClient() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [businessFilter, setBusinessFilter] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, businessesRes] = await Promise.all([
        fetch(`/api/admin/bookings?status=${statusFilter}&businessId=${businessFilter}`),
        fetch('/api/admin/businesses'),
      ]);

      const bookingsData = await bookingsRes.json();
      const businessesData = await businessesRes.json();

      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setBusinesses(Array.isArray(businessesData) ? businessesData : []);
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, businessFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Todas las Reservas</h1>
            <p className="text-sm text-gray-500">Vista general de reservas del sistema</p>
          </div>
        </div>
        <Button onClick={fetchData} variant="secondary" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" /> Actualizar
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((f) => (
            <button
              key={f?.value}
              onClick={() => setStatusFilter(f?.value ?? 'all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                statusFilter === f?.value
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {f?.label}
            </button>
          ))}
        </div>
        <select
          value={businessFilter}
          onChange={(e) => setBusinessFilter(e.target?.value ?? 'all')}
          className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white"
        >
          <option value="all">Todos los negocios</option>
          {(businesses ?? []).map((b) => (
            <option key={b?.id} value={b?.id}>
              {b?.name}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Cargando reservas...</div>
          ) : (bookings?.length ?? 0) === 0 ? (
            <div className="p-8 text-center text-gray-500">No hay reservas</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {(bookings ?? []).map((booking) => (
                <div key={booking?.id} className="p-4 sm:p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          #{booking?.uniqueId}
                        </span>
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
                      <h3 className="font-medium text-gray-900 mt-2">{booking?.customerName}</h3>
                      <p className="text-sm text-gray-600">
                        {booking?.service?.name} • {formatShortDate(booking?.bookingDate)} •{' '}
                        {booking?.startTime} - {booking?.endTime}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Negocio: {booking?.business?.name}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
