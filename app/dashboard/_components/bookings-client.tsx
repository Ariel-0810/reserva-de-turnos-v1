'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { ClipboardList, Eye, Check, X, RefreshCw, Search, MessageCircle, Filter, Bell, BellOff, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { formatShortDate, formatDate, timeAgo, playBeep } from '@/lib/utils';
import { STATUS_LABELS, BookingStatus } from '@/lib/types';
import {
  generateWhatsAppLink,
  getWhatsAppConfirmationMessage,
  getWhatsAppCancellationMessage,
  WhatsAppBookingParams,
} from '@/lib/whatsapp';
import toast from 'react-hot-toast';

interface BookingService {
  id: string;
  name: string;
  price: string;
}

interface Booking {
  id: string;
  uniqueId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  createdAt: string;
  service?: BookingService | null;
}

interface BusinessInfo {
  name: string;
  slug: string;
  whatsappNumber?: string | null;
}

interface ServiceItem {
  id: string;
  name: string;
}

const statusFilters: { value: BookingStatus | 'all'; label: string }[] = [
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'CONFIRMED', label: 'Confirmadas' },
  { value: 'CANCELLED', label: 'Canceladas' },
  { value: 'all', label: 'Todas' },
];

const LAST_SEEN_KEY = 'bookingsLastSeenAt';

interface SubInfo {
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED';
  trialEndsAt: string | null;
  paidUntil: string | null;
}

export function BookingsClient() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [trialSub, setTrialSub] = useState<SubInfo | null>(null);

  useEffect(() => {
    fetch('/api/business/subscription')
      .then((r) => r.json())
      .then((d) => setTrialSub(d?.subscription ?? null))
      .catch(() => {});
  }, []);

  const trialBanner = useMemo(() => {
    if (!trialSub || trialSub.status !== 'TRIAL' || !trialSub.trialEndsAt) return null;
    const days = Math.ceil((new Date(trialSub.trialEndsAt).getTime() - Date.now()) / 86400000);
    if (days > 3) return null;
    const msg =
      days <= 0
        ? 'Tu prueba gratis venció'
        : days === 1
        ? 'Tu prueba gratis vence mañana'
        : `Tu prueba gratis vence en ${days} días`;
    return { msg, expired: days <= 0 };
  }, [trialSub]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BookingStatus | 'all'>('PENDING');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [pendingWhatsApp, setPendingWhatsApp] = useState<{ booking: Booking; status: 'CONFIRMED' | 'CANCELLED' } | null>(null);
  const [lastSeenAt, setLastSeenAt] = useState<number>(0);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef<boolean>(false);
  const notifPermissionRef = useRef<NotificationPermission>('default');

  const fetchBusinessInfo = async () => {
    try {
      const res = await fetch('/api/business');
      const data = await res.json();
      if (data?.id) {
        setBusinessInfo({
          name: data.name ?? '',
          slug: data.slug ?? '',
          whatsappNumber: data.whatsappNumber ?? null,
        });
      }
    } catch (error) {
      console.error('Error fetching business info:', error);
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
      console.error('Error fetching services:', error);
    }
  };

  const fetchBookings = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/bookings?status=all`);
      const data = await res.json();
      const list: Booking[] = Array.isArray(data) ? data : [];

      // Detectar reservas nuevas (PENDING) en fetches subsiguientes
      if (initializedRef.current) {
        const newPending = list.filter(
          (b) => b.status === 'PENDING' && !seenIdsRef.current.has(b.id)
        );
        if (newPending.length > 0) {
          const count = newPending.length;
          toast.success(
            count === 1 ? '1 reserva nueva' : `${count} reservas nuevas`,
            { icon: '🔔' }
          );
          playBeep();

          if (notifPermissionRef.current === 'granted' && typeof window !== 'undefined' && 'Notification' in window) {
            try {
              const first = newPending[0];
              const body =
                count === 1
                  ? `${first.customerName} • ${first.service?.name ?? ''} • ${first.startTime}`
                  : `Tenés ${count} reservas pendientes nuevas.`;
              new Notification('Reserva nueva', { body, icon: '/favicon.svg' });
            } catch {
              // ignorar fallos de Notification
            }
          }
        }
      } else {
        initializedRef.current = true;
      }

      // Actualizar set de IDs vistos
      seenIdsRef.current = new Set(list.map((b) => b.id));
      setBookings(list);
    } catch (error) {
      console.error(error);
      if (!silent) toast.error('Error al cargar reservas');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessInfo();
    fetchServices();
    fetchBookings();

    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(LAST_SEEN_KEY) : null;
    setLastSeenAt(stored ? Number(stored) : 0);

    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = Notification.permission;
      setNotifPermission(perm);
      notifPermissionRef.current = perm;
    }

    // Polling cada 30s
    const interval = setInterval(() => {
      fetchBookings(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const requestNotifPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('Tu navegador no soporta notificaciones.');
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setNotifPermission(result);
      notifPermissionRef.current = result;
      if (result === 'granted') {
        playBeep(); // gesture válido → habilita audio en lo sucesivo
        toast.success('Notificaciones activadas');
      } else if (result === 'denied') {
        toast.error('Notificaciones bloqueadas en el navegador');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Contadores por status (sobre la lista completa, ignorando otros filtros)
  const counts = useMemo(() => {
    const c = { PENDING: 0, CONFIRMED: 0, CANCELLED: 0, all: bookings.length };
    for (const b of bookings) {
      if (b.status in c) (c as any)[b.status] += 1;
    }
    return c as { PENDING: number; CONFIRMED: number; CANCELLED: number; all: number };
  }, [bookings]);

  // Reservas pendientes nuevas desde la última vez que el dueño miró el dashboard
  const unseenCount = useMemo(() => {
    if (!lastSeenAt) return 0;
    return bookings.filter(
      (b) => b.status === 'PENDING' && new Date(b.createdAt).getTime() > lastSeenAt
    ).length;
  }, [bookings, lastSeenAt]);

  const markAsSeen = () => {
    const now = Date.now();
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LAST_SEEN_KEY, String(now));
    }
    setLastSeenAt(now);
  };

  const filteredBookings = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    const fromTs = dateFrom ? new Date(dateFrom + 'T00:00:00').getTime() : null;
    const toTs = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : null;

    return bookings.filter((b) => {
      if (filter !== 'all' && b.status !== filter) return false;
      if (serviceFilter !== 'all' && b.service?.id !== serviceFilter) return false;

      if (search) {
        const name = (b.customerName ?? '').toLowerCase();
        const phone = (b.customerPhone ?? '').toLowerCase();
        if (!name.includes(search) && !phone.includes(search)) return false;
      }

      if (fromTs || toTs) {
        const bDate = new Date(b.bookingDate.split('T')[0] + 'T00:00:00').getTime();
        if (fromTs && bDate < fromTs) return false;
        if (toTs && bDate > toTs) return false;
      }

      return true;
    });
  }, [bookings, filter, serviceFilter, searchQuery, dateFrom, dateTo]);

  const getPublicBookingUrl = () => {
    if (typeof window === 'undefined' || !businessInfo?.slug) return '';
    return `${window.location.origin}/booking/${businessInfo.slug}`;
  };

  const openWhatsAppForBooking = (booking: Booking, status: 'CONFIRMED' | 'CANCELLED') => {
    if (!booking.customerPhone) {
      toast.error('El cliente no tiene número de teléfono');
      return;
    }

    const params: WhatsAppBookingParams = {
      businessName: businessInfo?.name ?? '',
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      serviceName: booking.service?.name ?? '',
      bookingDate: formatDate(booking.bookingDate),
      startTime: booking.startTime,
      endTime: booking.endTime,
      uniqueId: booking.uniqueId,
      publicBookingUrl: getPublicBookingUrl(),
    };

    const message = status === 'CONFIRMED'
      ? getWhatsAppConfirmationMessage(params)
      : getWhatsAppCancellationMessage(params);

    const link = generateWhatsAppLink(booking.customerPhone, message);
    window.open(link, '_blank');
  };

  const handleAction = async (bookingId: string, status: 'CONFIRMED' | 'CANCELLED', booking?: Booking) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error();

      toast.success(status === 'CONFIRMED' ? 'Reserva confirmada' : 'Reserva cancelada');

      const targetBooking = booking ?? selectedBooking;
      if (targetBooking?.customerPhone) {
        setPendingWhatsApp({ booking: targetBooking, status });
        setWhatsappModalOpen(true);
      }

      setSelectedBooking(null);
      fetchBookings();
    } catch (error) {
      toast.error('Error al actualizar reserva');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (pendingWhatsApp) {
      openWhatsAppForBooking(pendingWhatsApp.booking, pendingWhatsApp.status);
    }
    setWhatsappModalOpen(false);
    setPendingWhatsApp(null);
  };

  const getStatusBadge = (status: BookingStatus) => {
    const variant = status === 'CONFIRMED' ? 'success' : status === 'PENDING' ? 'warning' : 'destructive';
    return <Badge variant={variant}>{STATUS_LABELS[status] ?? status}</Badge>;
  };

  const clearAllFilters = () => {
    setServiceFilter('all');
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
  };

  const hasExtraFilters =
    serviceFilter !== 'all' || searchQuery.trim() !== '' || dateFrom !== '' || dateTo !== '';

  return (
    <div className="space-y-6">
      {trialBanner && (
        <div
          className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
            trialBanner.expired
              ? 'bg-red-50 border-red-200'
              : 'bg-amber-50 border-amber-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={`w-5 h-5 shrink-0 mt-0.5 ${
                trialBanner.expired ? 'text-red-600' : 'text-amber-600'
              }`}
            />
            <div>
              <p className={`font-semibold ${trialBanner.expired ? 'text-red-900' : 'text-amber-900'}`}>
                {trialBanner.msg}
              </p>
              <p className={`text-sm ${trialBanner.expired ? 'text-red-800' : 'text-amber-800'}`}>
                Configurá tu pago para no perder el acceso al dashboard ni a tu link público.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/settings"
            className={`text-white text-sm font-medium px-4 py-2 rounded-xl whitespace-nowrap shadow-sm ${
              trialBanner.expired
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            Ver mi suscripción
          </Link>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Reservas</h1>
              {unseenCount > 0 && (
                <button
                  onClick={() => {
                    setFilter('PENDING');
                    markAsSeen();
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-violet-600 text-white shadow-sm hover:bg-violet-700"
                  title="Reservas pendientes nuevas desde tu última visita"
                >
                  {unseenCount} nueva{unseenCount === 1 ? '' : 's'}
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500">Gestiona las reservas de tu negocio</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {notifPermission === 'default' && (
            <Button className="rounded-full shadow-sm" onClick={requestNotifPermission} variant="secondary" size="sm">
              <Bell className="w-4 h-4 mr-2" /> Activar notificaciones
            </Button>
          )}
          {notifPermission === 'granted' && (
            <span
              className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full shadow-sm border border-green-200"
              title="Te avisaremos cuando llegue una reserva nueva"
            >
              <Bell className="w-3 h-3" /> Notif. activas
            </span>
          )}
          {notifPermission === 'denied' && (
            <span
              className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-xl border border-gray-200"
              title="Habilitalas desde la configuración del navegador"
            >
              <BellOff className="w-3 h-3" /> Notif. bloqueadas
            </span>
          )}
          <Button className="rounded-full shadow-sm" onClick={() => fetchBookings()} variant="secondary" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" /> Actualizar
          </Button>
        </div>
      </div>

      {/* Status tabs con contador */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((f) => {
          const count = counts[f.value];
          const isActive = filter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => {
                setFilter(f.value);
                markAsSeen();
              }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span>{f.label}</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filtros avanzados */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o teléfono"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>

            {/* Filtro servicio */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              >
                <option value="all">Todos los servicios</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Rango fechas */}
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              aria-label="Desde"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              aria-label="Hasta"
            />
          </div>

          {hasExtraFilters && (
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>
                Mostrando {filteredBookings.length} de {bookings.length} reservas
              </span>
              <button
                onClick={clearAllFilters}
                className="text-violet-600 hover:text-violet-700 font-medium"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bookings List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Cargando reservas...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No hay reservas que coincidan con los filtros aplicados.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredBookings.map((booking) => (
                <div
                  key={booking?.id}
                  className="p-4 sm:p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                          #{booking?.uniqueId}
                        </span>
                        {getStatusBadge(booking?.status)}
                        {booking?.createdAt && (
                          <span className="text-xs text-gray-400">
                            creada {timeAgo(booking.createdAt)}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mt-2">{booking?.customerName}</h3>
                      <p className="text-sm text-gray-600">
                        {booking?.service?.name} • {formatShortDate(booking?.bookingDate)} • {booking?.startTime} - {booking?.endTime}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <Eye className="w-4 h-4 mr-1" /> Ver
                      </Button>
                      {booking?.status === 'PENDING' && (
                        <>
                          <Button
                          className="rounded-full shadow-sm"
                            variant="primary"
                            size="sm"
                            onClick={() => handleAction(booking?.id, 'CONFIRMED', booking)}
                          >
                            <Check className="w-4 h-4 mr-1" /> Confirmar
                          </Button>
                          <Button
                          className="rounded-full shadow-sm"
                            variant="danger"
                            size="sm"
                            onClick={() => handleAction(booking?.id, 'CANCELLED', booking)}
                          >
                            <X className="w-4 h-4 mr-1" /> Cancelar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title="Detalle de Reserva"
        size="md"
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded">#{selectedBooking?.uniqueId}</span>
              {getStatusBadge(selectedBooking?.status)}
              {selectedBooking?.createdAt && (
                <span className="text-xs text-gray-500">
                  creada {timeAgo(selectedBooking.createdAt)}
                </span>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Cliente</p>
                <p className="font-medium text-gray-900">{selectedBooking?.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Teléfono</p>
                <p className="font-medium text-gray-900">{selectedBooking?.customerPhone}</p>
              </div>
              {selectedBooking?.customerEmail && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                  <p className="font-medium text-gray-900">{selectedBooking?.customerEmail}</p>
                </div>
              )}
            </div>

            <div className="bg-violet-50 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-xs text-violet-600 uppercase tracking-wide">Servicio</p>
                <p className="font-medium text-gray-900">{selectedBooking?.service?.name}</p>
              </div>
              <div>
                <p className="text-xs text-violet-600 uppercase tracking-wide">Fecha</p>
                <p className="font-medium text-gray-900">{formatDate(selectedBooking?.bookingDate)}</p>
              </div>
              <div>
                <p className="text-xs text-violet-600 uppercase tracking-wide">Horario</p>
                <p className="font-medium text-gray-900">
                  {selectedBooking?.startTime} - {selectedBooking?.endTime}
                </p>
              </div>
            </div>

            {selectedBooking?.status === 'PENDING' && (
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleAction(selectedBooking?.id, 'CONFIRMED', selectedBooking)}
                  loading={actionLoading}
                >
                  <Check className="w-4 h-4 mr-2" /> Confirmar
                </Button>
                <Button
                  variant="danger"
                  className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => handleAction(selectedBooking?.id, 'CANCELLED', selectedBooking)}
                  loading={actionLoading}
                >
                  <X className="w-4 h-4 mr-2" /> Cancelar
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* WhatsApp Notification Modal */}
      <Modal
        isOpen={whatsappModalOpen}
        onClose={() => {
          setWhatsappModalOpen(false);
          setPendingWhatsApp(null);
        }}
        title="Notificar por WhatsApp"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {pendingWhatsApp?.status === 'CONFIRMED'
                  ? '¡Reserva confirmada!'
                  : 'Reserva cancelada'}
              </p>
              <p className="text-sm text-gray-600">
                ¿Deseas enviar un WhatsApp a {pendingWhatsApp?.booking?.customerName}?
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-500">
            Se abrirá WhatsApp con un mensaje listo para enviar al cliente con todos los detalles de la reserva.
          </p>

          <div className="flex gap-3">
            <Button onClick={handleSendWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700">
              <MessageCircle className="w-4 h-4 mr-2" /> Enviar WhatsApp
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setWhatsappModalOpen(false);
                setPendingWhatsApp(null);
              }}
            >
              Omitir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
