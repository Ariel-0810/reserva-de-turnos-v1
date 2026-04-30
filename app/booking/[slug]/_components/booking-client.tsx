'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  Clock,
  MapPin,
  Phone,
  User,
  Mail,
  CheckCircle,
  X,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { cn, formatPrice, formatShortDate, formatDate } from '@/lib/utils';
import { STATUS_LABELS, BookingStatus } from '@/lib/types';
import { COUNTRIES_LIST, getPhoneConfig, buildFullPhoneNumber, CountryPhoneConfig } from '@/lib/phone-prefixes';
import { generateWhatsAppLink, getWhatsAppCustomerCancellationToOwnerMessage } from '@/lib/whatsapp';
import toast from 'react-hot-toast';

interface Service {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: string;
}

interface BusinessHours {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface Business {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  services: Service[];
  hours: BusinessHours[];
  ownerWhatsApp?: string | null;
}

interface Slot {
  start: string;
  end: string;
  available: boolean;
}

interface BookingClientProps {
  business: Business;
}

export function BookingClient({ business }: BookingClientProps) {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<any>(null);

  // Search booking
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // WhatsApp modal for cancelled booking notification
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [cancelledBookingData, setCancelledBookingData] = useState<any>(null);
  
  // Confirm cancellation modal
  const [confirmCancelModalOpen, setConfirmCancelModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '', // This is only the local part (without prefix)
    customerEmail: '',
  });

  // Country/phone prefix state
  const [selectedCountry, setSelectedCountry] = useState<string>('AR');
  const [phoneConfig, setPhoneConfig] = useState<CountryPhoneConfig>(getPhoneConfig('AR'));
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [detectingCountry, setDetectingCountry] = useState(true);

  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Detect country on mount
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const res = await fetch('/api/public/detect-country');
        const data = await res.json();
        if (data?.countryCode) {
          setSelectedCountry(data.countryCode);
          setPhoneConfig(getPhoneConfig(data.countryCode));
        }
      } catch (error) {
        console.error('Country detection failed:', error);
        // Keep default (AR)
      } finally {
        setDetectingCountry(false);
      }
    };
    detectCountry();
  }, []);

  // Fetch slots when date selected
  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchSlots();
    }
  }, [selectedDate, selectedService]);

  const fetchSlots = async () => {
    if (!selectedDate || !selectedService) return;
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot(null);

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const res = await fetch(
        `/api/public/slots?businessId=${business?.id}&serviceId=${selectedService?.id}&date=${dateStr}`
      );
      const data = await res.json();
      setSlots((data?.slots ?? []).filter((s: Slot) => s?.available));
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar horarios');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setPhoneConfig(getPhoneConfig(countryCode));
    setCountryDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedSlot) return;

    // Validate phone number
    const cleanPhone = formData.customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 6) {
      toast.error('Por favor ingresa un número de teléfono válido');
      return;
    }

    // Build full phone number with country code
    const fullPhoneNumber = buildFullPhoneNumber(phoneConfig.dialCode, formData.customerPhone);

    setSubmitting(true);
    try {
      const res = await fetch('/api/public/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business?.id,
          serviceId: selectedService?.id,
          date: selectedDate?.toISOString()?.split('T')?.[0],
          startTime: selectedSlot?.start,
          customerName: formData.customerName,
          customerPhone: fullPhoneNumber, // Full number with country code
          customerEmail: formData.customerEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error');

      setConfirmation(data?.booking);
      setStep(5);
    } catch (error: any) {
      toast.error(error?.message || 'Error al crear reserva');
    } finally {
      setSubmitting(false);
    }
  };

  const searchBooking = async () => {
    if (!searchId.trim()) return;
    setSearching(true);

    try {
      const res = await fetch(
        `/api/public/booking/search?uniqueId=${searchId.trim()}&slug=${business?.slug}`
      );
      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || 'Reserva no encontrada');
        setSearchResult(null);
      } else {
        setSearchResult(data);
        setSearchModalOpen(true);
      }
    } catch {
      toast.error('Error al buscar reserva');
    } finally {
      setSearching(false);
    }
  };

  const openCancelConfirmation = () => {
    setConfirmCancelModalOpen(true);
  };

  const cancelBooking = async () => {
    if (!searchResult?.uniqueId) return;
    
    setConfirmCancelModalOpen(false);

    // Save booking data before cancelling (for WhatsApp message)
    const bookingDataForWhatsApp = {
      businessName: business?.name,
      customerName: searchResult?.customerName,
      customerPhone: searchResult?.customerPhone,
      serviceName: searchResult?.service?.name,
      bookingDate: formatDate(searchResult?.bookingDate),
      startTime: searchResult?.startTime,
      endTime: searchResult?.endTime,
      uniqueId: searchResult?.uniqueId,
    };

    try {
      const res = await fetch('/api/public/booking/cancel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uniqueId: searchResult.uniqueId, slug: business?.slug }),
      });

      if (!res.ok) throw new Error();
      toast.success('Reserva cancelada exitosamente');
      setSearchModalOpen(false);
      setSearchResult(null);
      setSearchId('');

      // Show WhatsApp modal if owner has WhatsApp configured
      if (business?.ownerWhatsApp) {
        setCancelledBookingData(bookingDataForWhatsApp);
        setWhatsAppModalOpen(true);
      }
    } catch {
      toast.error('Error al cancelar reserva');
    }
  };

  const handleSendWhatsAppToOwner = () => {
    if (!cancelledBookingData || !business?.ownerWhatsApp) return;
    
    const message = getWhatsAppCustomerCancellationToOwnerMessage(cancelledBookingData);
    const link = generateWhatsAppLink(business.ownerWhatsApp, message);
    window.open(link, '_blank');
    setWhatsAppModalOpen(false);
    setCancelledBookingData(null);
  };

  const handleSkipWhatsApp = () => {
    setWhatsAppModalOpen(false);
    setCancelledBookingData(null);
  };

  // Calendar logic
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // ✅ Límite máximo: 30 días hacia adelante
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 30);
    maxDate.setHours(23, 59, 59, 999);

    const days: { date: Date; isCurrentMonth: boolean; isDisabled: boolean }[] = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false, isDisabled: true });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      const dayOfWeek = date.getDay();
      const dayHours = (business?.hours ?? []).find((h) => h?.dayOfWeek === dayOfWeek);
      const isPast = date < today;
      const isTooFar = date > maxDate; // ✅ Deshabilitar fechas más allá de 30 días
      const isClosed = !dayHours?.isOpen;
      days.push({ date, isCurrentMonth: true, isDisabled: isPast || isTooFar || isClosed });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false, isDisabled: true });
    }

    return days;
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const resetBooking = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setSlots([]);
    setConfirmation(null);
    setFormData({ customerName: '', customerPhone: '', customerEmail: '' });
  };

  const handleShareBooking = async () => {
    if (!confirmation) return;

    const shareText =
      `🗓️ Reserva en ${confirmation.businessName}\n\n` +
      `• Servicio: ${confirmation.serviceName}\n` +
      `• Fecha: ${formatDate(confirmation.date)}\n` +
      `• Horario: ${confirmation.startTime} - ${confirmation.endTime}\n` +
      `• ID: ${confirmation.uniqueId}\n\n` +
      `¡Nos vemos!`;

    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: `Reserva en ${confirmation.businessName}`,
          text: shareText,
        });
        return;
      } catch (err) {
        // El usuario canceló el share o falló — caer al fallback
      }
    }

    // Fallback: abrir WhatsApp con el mensaje listo (sin destinatario, lo elige el usuario)
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-app-gradient">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{business?.name}</h1>
          </div>
          {business?.description && (
            <p className="text-gray-600 text-sm ml-13">{business?.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
            {business?.address && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {business?.address}
              </span>
            )}
            {business?.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-4 h-4" /> {business?.phone}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar mi reserva (ID)"
              value={searchId}
              onChange={(e) => setSearchId(e.target?.value ?? '')}
              icon={<Search className="w-4 h-4" />}
              className="flex-1"
            />
            <Button onClick={searchBooking} loading={searching} size="md">
              Buscar
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Step 5: Confirmation */}
        {step === 5 && confirmation ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Reserva enviada!</h2>
              <p className="text-gray-600 mb-6">Tu reserva está pendiente de confirmación.</p>

              <div className="bg-violet-50 rounded-xl p-6 text-left mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-violet-600">ID de Reserva</span>
                  <span className="font-mono font-bold text-lg text-violet-700">
                    {confirmation?.uniqueId}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <p><strong>Negocio:</strong> {confirmation?.businessName}</p>
                  <p><strong>Servicio:</strong> {confirmation?.serviceName}</p>
                  <p><strong>Fecha:</strong> {formatDate(confirmation?.date)}</p>
                  <p><strong>Horario:</strong> {confirmation?.startTime} - {confirmation?.endTime}</p>
                  <p><strong>Cliente:</strong> {confirmation?.customerName}</p>
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Guarda tu ID de reserva para consultar o cancelar.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={handleShareBooking} className="bg-green-600 hover:bg-green-700">
                  <Share2 className="w-4 h-4 mr-2" /> Compartir esta reserva
                </Button>
                <Button onClick={resetBooking} variant="outline">
                  Hacer otra reserva
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              {/* Steps indicator */}
              <div className="flex items-center gap-2 mb-6">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                      step >= s
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    )}
                  >
                    {s}
                  </div>
                ))}
              </div>

              {/* Step 1: Select Service */}
              {step === 1 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Selecciona un servicio</h2>
                  <div className="space-y-3">
                    {(business?.services ?? []).length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No hay servicios disponibles</p>
                    ) : (
                      (business?.services ?? []).map((service) => (
                        <button
                          key={service?.id}
                          onClick={() => {
                            setSelectedService(service);
                            setStep(2);
                          }}
                          className={cn(
                            'w-full text-left p-4 rounded-xl border-2 transition-all hover:border-violet-500',
                            selectedService?.id === service?.id
                              ? 'border-violet-500 bg-violet-50'
                              : 'border-gray-200 bg-white'
                          )}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-900">{service?.name}</h3>
                              {service?.description && (
                                <p className="text-sm text-gray-500 mt-1">{service?.description}</p>
                              )}
                              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                <Clock className="w-4 h-4" /> {service?.durationMinutes} minutos
                              </p>
                            </div>
                            <span className="font-semibold text-violet-600">
                              {formatPrice(service?.price)}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Select Date */}
              {step === 2 && (
                <div>
                  <button
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all mb-4"
                  >
                    <ArrowLeft className="w-4 h-4" /> Volver
                  </button>
                  <h2 className="text-lg font-semibold text-gray-900 text-center mb-4">Selecciona una fecha</h2>

                  {/* Mini calendar */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <span className="font-medium">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                      </span>
                      <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {dayNames.map((d) => (
                        <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">
                          {d}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {getDaysInMonth().map((day, idx) => (
                        <button
                          key={idx}
                          disabled={day?.isDisabled}
                          onClick={() => {
                            setSelectedDate(day?.date);
                            setStep(3);
                          }}
                          className={cn(
                            'p-2 rounded-lg text-sm transition-all',
                            !day?.isCurrentMonth && 'text-gray-300',
                            day?.isDisabled && 'text-gray-300 cursor-not-allowed',
                            !day?.isDisabled &&
                              day?.isCurrentMonth &&
                              'hover:bg-violet-100 text-gray-900',
                            selectedDate?.toDateString() === day?.date?.toDateString() &&
                              'bg-violet-600 text-white hover:bg-violet-700'
                          )}
                        >
                          {day?.date?.getDate()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Select Time */}
              {step === 3 && (
                <div>
                  <button
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all mb-4"
                  >
                    <ArrowLeft className="w-4 h-4" /> Volver
                  </button>
                  <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">Selecciona un horario</h2>

                  <p className="text-sm text-gray-600 mb-4 text-center">
                    {selectedDate ? formatDate(selectedDate) : ''}
                  </p>

                  {loadingSlots ? (
                    <p className="text-center py-8 text-gray-500">Cargando horarios...</p>
                  ) : (slots?.length ?? 0) === 0 ? (
                    <p className="text-center py-8 text-gray-500">
                      No hay horarios disponibles para esta fecha
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {(slots ?? []).map((slot, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedSlot(slot);
                            setStep(4);
                          }}
                          className={cn(
                            'p-3 rounded-lg text-sm font-medium border-2 transition-all',
                            selectedSlot?.start === slot?.start
                              ? 'border-violet-500 bg-violet-50 text-violet-700'
                              : 'border-gray-200 hover:border-violet-300'
                          )}
                        >
                          {slot?.start}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Customer Info */}
              {step === 4 && (
                <div>
                  <button
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all mb-4"
                  >
                    <ArrowLeft className="w-4 h-4" /> Volver
                  </button>
                  <h2 className="text-lg font-semibold text-gray-900 text-center mb-4">Tus datos</h2>

                  {/* Summary */}
                  <div className="bg-violet-50 rounded-xl p-4 mb-6">
                    <p className="text-sm text-violet-700">
                      <strong>{selectedService?.name}</strong> •{' '}
                      {selectedDate ? formatShortDate(selectedDate) : ''} •{' '}
                      {selectedSlot?.start} - {selectedSlot?.end}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      label="Nombre completo"
                      value={formData?.customerName ?? ''}
                      onChange={(e) =>
                        setFormData({ ...formData, customerName: e.target?.value ?? '' })
                      }
                      icon={<User className="w-4 h-4" />}
                      required
                    />
                    
                    {/* Phone with country selector */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Teléfono / WhatsApp <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2 w-full">
                        {/* Country selector - compact for mobile */}
                        <div className="relative flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                            className="flex items-center gap-1 px-2 sm:px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors h-[42px]"
                          >
                            <span className="text-base sm:text-lg">{phoneConfig.flag}</span>
                            <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">{phoneConfig.prefix}</span>
                            <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                          </button>
                          
                          {/* Dropdown */}
                          {countryDropdownOpen && (
                            <div className="absolute z-50 mt-1 left-0 w-56 sm:w-64 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                              {COUNTRIES_LIST.map((country) => (
                                <button
                                  key={country.code}
                                  type="button"
                                  onClick={() => handleCountryChange(country.code)}
                                  className={cn(
                                    'w-full flex items-center gap-2 sm:gap-3 px-3 py-2 hover:bg-gray-50 transition-colors',
                                    selectedCountry === country.code && 'bg-violet-50'
                                  )}
                                >
                                  <span className="text-base">{country.flag}</span>
                                  <span className="text-sm text-gray-900 flex-1 text-left truncate">{country.name}</span>
                                  <span className="text-xs sm:text-sm text-gray-500">{country.prefix}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Phone input */}
                        <input
                          type="tel"
                          value={formData?.customerPhone ?? ''}
                          onChange={(e) =>
                            setFormData({ ...formData, customerPhone: e.target?.value ?? '' })
                          }
                          placeholder={phoneConfig.placeholder}
                          className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Ingresa solo los números de tu teléfono. El prefijo se agrega automáticamente.
                      </p>
                    </div>

                    <Input
                      label="Email (opcional)"
                      type="email"
                      value={formData?.customerEmail ?? ''}
                      onChange={(e) =>
                        setFormData({ ...formData, customerEmail: e.target?.value ?? '' })
                      }
                      icon={<Mail className="w-4 h-4" />}
                    />

                    <Button type="submit" className="w-full" size="lg" loading={submitting}>
                      Enviar reserva
                    </Button>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Search Result Modal */}
      <Modal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        title="Detalle de Reserva"
        size="md"
      >
        {searchResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-lg">#{searchResult?.uniqueId}</span>
              <Badge
                variant={
                  searchResult?.status === 'CONFIRMED'
                    ? 'success'
                    : searchResult?.status === 'PENDING'
                    ? 'warning'
                    : 'default'
                }
              >
                {STATUS_LABELS[searchResult?.status as BookingStatus]}
              </Badge>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <p><strong>Servicio:</strong> {searchResult?.service?.name}</p>
              <p><strong>Fecha:</strong> {formatDate(searchResult?.bookingDate)}</p>
              <p><strong>Horario:</strong> {searchResult?.startTime} - {searchResult?.endTime}</p>
              <p><strong>Cliente:</strong> {searchResult?.customerName}</p>
              <p><strong>Teléfono:</strong> {searchResult?.customerPhone}</p>
            </div>

            {(searchResult?.status === 'PENDING' || searchResult?.status === 'CONFIRMED') && (
              <Button variant="danger" className="w-full" onClick={openCancelConfirmation}>
                <X className="w-4 h-4 mr-2" /> Cancelar reserva
              </Button>
            )}
          </div>
        )}
      </Modal>

      {/* Confirm cancellation modal */}
      <Modal
        isOpen={confirmCancelModalOpen}
        onClose={() => setConfirmCancelModalOpen(false)}
        title="Confirmar cancelación"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
              <X className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-gray-900 font-medium mb-2">
                ¿Estás seguro de cancelar esta reserva?
              </p>
              <p className="text-gray-600 text-sm">
                Esta acción no se puede deshacer. Se notificará al negocio sobre la cancelación.
              </p>
            </div>
          </div>

          {searchResult && (
            <div className="bg-red-50 rounded-xl p-4 space-y-1 text-sm border border-red-200">
              <p><strong>ID:</strong> #{searchResult?.uniqueId}</p>
              <p><strong>Servicio:</strong> {searchResult?.service?.name}</p>
              <p><strong>Fecha:</strong> {formatDate(searchResult?.bookingDate)}</p>
              <p><strong>Horario:</strong> {searchResult?.startTime} - {searchResult?.endTime}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmCancelModalOpen(false)}
            >
              No, mantener reserva
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={cancelBooking}
            >
              <X className="w-4 h-4 mr-2" />
              Sí, cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* WhatsApp notification modal after cancellation */}
      <Modal
        isOpen={whatsAppModalOpen}
        onClose={handleSkipWhatsApp}
        title="¿Notificar al negocio?"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Tu reserva ha sido cancelada. ¿Deseas enviar un mensaje por WhatsApp a <strong>{business?.name}</strong> para informarles de la cancelación?
          </p>

          {cancelledBookingData && (
            <div className="bg-red-50 rounded-xl p-4 space-y-1 text-sm">
              <p><strong>ID:</strong> #{cancelledBookingData?.uniqueId}</p>
              <p><strong>Servicio:</strong> {cancelledBookingData?.serviceName}</p>
              <p><strong>Fecha:</strong> {cancelledBookingData?.bookingDate}</p>
              <p><strong>Horario:</strong> {cancelledBookingData?.startTime} - {cancelledBookingData?.endTime}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={handleSendWhatsAppToOwner}
            >
              <Phone className="w-4 h-4 mr-2" />
              Enviar WhatsApp
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleSkipWhatsApp}
            >
              Omitir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
