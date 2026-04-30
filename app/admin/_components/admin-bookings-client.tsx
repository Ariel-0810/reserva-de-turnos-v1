'use client';

import { useState, useEffect, useMemo } from 'react';
import { ClipboardList, RefreshCw, Search, CheckCircle, Ban, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatShortDate, timeAgo } from '@/lib/utils';
import { STATUS_LABELS, BookingStatus } from '@/lib/types';
import toast from 'react-hot-toast';

interface Booking {
  id: string;
  uniqueId: string;
  customerName: string;
  customerPhone: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  createdAt: string;
  service?: { name: string } | null;
  business?: { name: string; slug: string } | null;
}

interface Business { id: string; name: string }

interface Metrics {
  weekFrom: string;
  weekTo: string;
  confirmedThisWeek: number;
  cancelledThisWeek: number;
  projectedRevenueThisWeek: string;
}

const statusFilters = [
  { value: 'all', label: 'Todas' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'CONFIRMED', label: 'Confirmadas' },
  { value: 'CANCELLED', label: 'Canceladas' },
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function startOfWeekISO(): string {
  const d = new Date();
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = utc.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  utc.setUTCDate(utc.getUTCDate() + diff);
  return utc.toISOString().slice(0, 10);
}

function startOfMonthISO(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

export function AdminBookingsClient() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [businessFilter, setBusinessFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('status', statusFilter);
      params.set('businessId', businessFilter);
      if (search.trim()) params.set('search', search.trim());
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const [bookingsRes, businessesRes, metricsRes] = await Promise.all([
        fetch(`/api/admin/bookings?${params.toString()}`),
        fetch('/api/admin/businesses'),
        fetch('/api/admin/bookings/metrics'),
      ]);

      const bookingsData = await bookingsRes.json();
      const businessesData = await businessesRes.json();
      const metricsData = await metricsRes.json();

      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setBusinesses(Array.isArray(businessesData) ? businessesData : []);
      setMetrics(metricsData?.error ? null : metricsData);
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch al cambiar status/business/dateFrom/dateTo. Search se aplica con un boton/Enter.
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, businessFilter, dateFrom, dateTo]);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const applyPreset = (preset: 'week' | 'month' | 'clear') => {
    if (preset === 'week') {
      setDateFrom(startOfWeekISO());
      setDateTo(todayISO());
    } else if (preset === 'month') {
      setDateFrom(startOfMonthISO());
      setDateTo(todayISO());
    } else {
      setDateFrom('');
      setDateTo('');
    }
  };

  const projectedFormatted = useMemo(() => {
    const n = Number(metrics?.projectedRevenueThisWeek ?? 0);
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
  }, [metrics]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Todas las Reservas</h1>
            <p className="text-sm text-gray-500">Vista global del sistema</p>
          </div>
        </div>
        <Button className="rounded-full shadow-sm" onClick={fetchData} variant="secondary" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" /> Actualizar
        </Button>
      </div>

      {/* Métricas semanales */}
      {metrics && (
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Confirmadas esta semana</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.confirmedThisWeek}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">$ proyectados esta semana</p>
                <p className="text-2xl font-bold text-gray-900">{projectedFormatted}</p>
                <p className="text-[10px] text-gray-400">Solo CONFIRMED, agregando service.price</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Canceladas esta semana</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.cancelledThisWeek}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'px-3 py-1.5 rounded-xl shadow-sm text-sm font-medium transition-all',
                statusFilter === f.value
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={onSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por ID, nombre o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl shadow-sm bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
          </form>
          <select
            value={businessFilter}
            onChange={(e) => setBusinessFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl shadow-sm bg-white"
          >
            <option value="all">Todos los negocios</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-black-500">Rango:</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-2 py-1.5 text-sm border border-gray-200 rounded-xl shadow-sm bg-white"
          />
          <span className="text-xs text-gray-400">a</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-2 py-1.5 text-sm border border-gray-200 rounded-xl shadow-sm bg-white"
          />
          <button
            onClick={() => applyPreset('week')}
            className="px-2 py-1.5 text-xs bg-violet-50 text-violet-700 hover:bg-violet-100 rounded-xl shadow-sm border border-violet-200"
          >
            Esta semana
          </button>
          <button
            onClick={() => applyPreset('month')}
            className="px-2 py-1.5 text-xs bg-violet-50 text-violet-700 hover:bg-violet-100 rounded-xl shadow-sm border border-violet-200"
          >
            Este mes
          </button>
          {(dateFrom || dateTo || search) && (
            <button
              onClick={() => {
                applyPreset('clear');
                setSearch('');
              }}
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Cargando reservas...</div>
          ) : bookings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No hay reservas con los filtros actuales</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {bookings.map((booking) => (
                <div key={booking.id} className="p-4 sm:p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          #{booking.uniqueId}
                        </span>
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
                        <span className="text-[11px] text-gray-400">{timeAgo(booking.createdAt)}</span>
                      </div>
                      <h3 className="font-medium text-gray-900 mt-2">{booking.customerName}</h3>
                      <p className="text-sm text-gray-600">
                        {booking.service?.name} • {formatShortDate(booking.bookingDate)} •{' '}
                        {booking.startTime} - {booking.endTime}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Negocio: {booking.business?.name} • Tel: {booking.customerPhone}
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
