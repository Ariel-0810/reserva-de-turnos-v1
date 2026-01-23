'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, Eye, Check, X, RefreshCw, Search, MessageCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { formatShortDate, formatDate } from '@/lib/utils';
import { STATUS_LABELS, STATUS_COLORS, BookingStatus } from '@/lib/types';
import { 
  generateWhatsAppLink, 
  getWhatsAppConfirmationMessage, 
  getWhatsAppCancellationMessage,
  WhatsAppBookingParams 
} from '@/lib/whatsapp';
import toast from 'react-hot-toast';

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
  service?: { name: string; price: string } | null;
}

interface BusinessInfo {
  name: string;
  slug: string;
  whatsappNumber?: string | null;
}

const statusFilters = [
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'CONFIRMED', label: 'Confirmadas' },
  { value: 'CANCELLED', label: 'Canceladas' },
  { value: 'all', label: 'Todas' },
];

export function BookingsClient() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [pendingWhatsApp, setPendingWhatsApp] = useState<{ booking: Booking; status: 'CONFIRMED' | 'CANCELLED' } | null>(null);

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

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?status=${filter}`);
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
    fetchBusinessInfo();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [filter]);

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
      
      // If we have the booking data and customer phone, show WhatsApp modal
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reservas</h1>
            <p className="text-sm text-gray-500">Gestiona las reservas de tu negocio</p>
          </div>
        </div>
        <Button onClick={fetchBookings} variant="secondary" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" /> Actualizar
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((f) => (
          <button
            key={f?.value}
            onClick={() => setFilter(f?.value ?? 'all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f?.value
                ? 'bg-violet-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {f?.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Cargando reservas...</div>
          ) : (bookings?.length ?? 0) === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No hay reservas {filter !== 'all' ? STATUS_LABELS[filter as BookingStatus]?.toLowerCase() : ''}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {(bookings ?? []).map((booking) => (
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
                            variant="primary"
                            size="sm"
                            onClick={() => handleAction(booking?.id, 'CONFIRMED', booking)}
                          >
                            <Check className="w-4 h-4 mr-1" /> Confirmar
                          </Button>
                          <Button
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
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1"
                  onClick={() => handleAction(selectedBooking?.id, 'CONFIRMED', selectedBooking)}
                  loading={actionLoading}
                >
                  <Check className="w-4 h-4 mr-2" /> Confirmar
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
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
