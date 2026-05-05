'use client';

import { useState, useEffect, useRef } from 'react';
import { signOut } from 'next-auth/react';
import { Settings, Copy, Check, Clock, Building, Save, CreditCard, AlertTriangle, Receipt, Trash2, RotateCcw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { Modal } from '@/components/ui/modal';
import { TimeInput } from '@/components/ui/time-input';
import { Badge } from '@/components/ui/badge';
import { DAY_NAMES } from '@/lib/types';
import toast from 'react-hot-toast';

type CancelReason = 'PRICE' | 'NOT_USED' | 'FOUND_BETTER' | 'OTHER';
const CANCEL_REASONS: { value: CancelReason; label: string }[] = [
  { value: 'PRICE', label: 'El precio' },
  { value: 'NOT_USED', label: 'No lo usé lo suficiente' },
  { value: 'FOUND_BETTER', label: 'Encontré algo mejor' },
  { value: 'OTHER', label: 'Otro motivo' },
];

interface PaymentRow {
  id: string;
  amount: number;
  paidAt: string;
  method: 'MANUAL_TRANSFER' | 'MERCADOPAGO';
  notes: string | null;
}

type SubStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED';
interface SubInfo {
  id: string;
  status: SubStatus;
  monthlyPrice: number;
  trialEndsAt: string | null;
  paidUntil: string | null;
  lastPaymentAt: string | null;
}

const subStatusLabel: Record<SubStatus, string> = {
  TRIAL: 'Prueba gratis',
  ACTIVE: 'Activa',
  PAST_DUE: 'Pago pendiente',
  SUSPENDED: 'Suspendida',
  CANCELLED: 'Cancelada',
};
const subStatusBadge: Record<SubStatus, 'success' | 'warning' | 'default'> = {
  TRIAL: 'warning',
  ACTIVE: 'success',
  PAST_DUE: 'warning',
  SUSPENDED: 'default',
  CANCELLED: 'default',
};

function fmtMoney(n: number): string {
  return Number(n).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}
function fmtDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function daysUntil(d: string | null): number | null {
  if (!d) return null;
  const ms = new Date(d).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

interface BusinessData {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsappNumber?: string | null;
  user: { name: string; email: string; phone?: string | null };
  hours: { dayOfWeek: number; isOpen: boolean; openTime: string; closeTime: string }[];
}

export function SettingsClient() {
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    address: '',
    phone: '',
    ownerName: '',
    ownerPhone: '',
  });

  const [hours, setHours] = useState<{ dayOfWeek: number; isOpen: boolean; openTime: string; closeTime: string }[]>([]);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);

  // Subscription
  const [sub, setSub] = useState<SubInfo | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState<CancelReason | ''>('');
  const [cancelReasonText, setCancelReasonText] = useState('');

  // Payments history
  const [payments, setPayments] = useState<PaymentRow[]>([]);

  // Delete account (zona de peligro)
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);

  const fetchSubscription = async () => {
    try {
      const res = await fetch('/api/business/subscription');
      const data = await res.json();
      setSub(data?.subscription ?? null);
    } catch {
      // silencioso, no crítico
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/business/payments');
      const data = await res.json();
      setPayments(Array.isArray(data?.payments) ? data.payments : []);
    } catch {
      // silencioso
    }
  };

  const cancelSubscription = async () => {
    setCancelLoading(true);
    try {
      const res = await fetch('/api/business/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          reason: cancelReason || null,
          reasonText: cancelReasonText.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Error');
      setCancelModalOpen(false);
      setCancelReason('');
      setCancelReasonText('');
      fetchSubscription();

      // Toast con botón "Deshacer" — 5 segundos
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-in fade-in slide-in-from-top-2' : 'animate-out fade-out'
            } bg-white rounded-2xl shadow-xl border border-gray-200 p-4 flex items-center gap-3 max-w-md`}
          >
            <Check className="w-5 h-5 text-green-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Suscripción cancelada</p>
              <p className="text-xs text-gray-500 truncate">{data?.message ?? ''}</p>
            </div>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                reactivateSubscription();
              }}
              className="text-sm font-semibold text-violet-700 hover:text-violet-800 px-3 py-1.5 rounded-lg hover:bg-violet-50 whitespace-nowrap inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Deshacer
            </button>
          </div>
        ),
        { duration: 5000 }
      );
    } catch (e: any) {
      toast.error(e?.message ?? 'Error al cancelar');
    } finally {
      setCancelLoading(false);
    }
  };

  const deleteAccount = async () => {
    setDeleteAccountLoading(true);
    try {
      const res = await fetch('/api/business/account', { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? 'Error al eliminar cuenta');
      }
      toast.success('Cuenta eliminada. ¡Hasta pronto!');
      // pequeño delay para que vea el toast antes del signOut
      setTimeout(() => {
        signOut({ callbackUrl: '/' });
      }, 600);
    } catch (e: any) {
      toast.error(e?.message ?? 'Error al eliminar cuenta');
      setDeleteAccountLoading(false);
    }
  };

  const reactivateSubscription = async () => {
    setCancelLoading(true);
    try {
      const res = await fetch('/api/business/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reactivate' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Error');
      toast.success('Suscripción reactivada');
      fetchSubscription();
    } catch (e: any) {
      toast.error(e?.message ?? 'Error al reactivar');
    } finally {
      setCancelLoading(false);
    }
  };

  const fetchBusiness = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/business');
      const data = await res.json();

      if (data?.id) {
        setBusiness(data);
        setFormData({
          name: data?.name ?? '',
          slug: data?.slug ?? '',
          description: data?.description ?? '',
          address: data?.address ?? '',
          phone: data?.phone ?? '',
          ownerName: data?.user?.name ?? '',
          ownerPhone: data?.user?.phone ?? '',
        });
        setHours(data?.hours ?? []);
      }
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusiness();
    fetchSubscription();
    fetchPayments();
  }, []);

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error');

      toast.success('Cambios guardados');
      fetchBusiness();
    } catch (error: any) {
      toast.error(error?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHours = async () => {
    setSavingHours(true);

    try {
      const res = await fetch('/api/business/hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error');

      toast.success('Horarios guardados');
    } catch (error: any) {
      toast.error(error?.message || 'Error al guardar horarios');
    } finally {
      setSavingHours(false);
    }
  };

  const getPublicLink = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/booking/${formData?.slug}`;
  };

  const copyLink = async () => {
    const link = getPublicLink();
    let copySuccess = false;
    
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
        copySuccess = true;
      } else {
        // Fallback for insecure contexts or iframes
        const textArea = document.createElement('textarea');
        textArea.value = link;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          copySuccess = document.execCommand('copy');
        } catch {
          copySuccess = false;
        }
        textArea.remove();
      }
    } catch {
      copySuccess = false;
    }
    
    if (copySuccess) {
      setCopied(true);
      toast.success('¡Link copiado al portapapeles!');
      setTimeout(() => setCopied(false), 2000);
    } else {
      // Open modal for manual copy
      setLinkModalOpen(true);
    }
  };

  const handleManualCopy = () => {
    if (linkInputRef.current) {
      linkInputRef.current.select();
      linkInputRef.current.setSelectionRange(0, 99999);
      try {
        document.execCommand('copy');
        toast.success('¡Link copiado!');
        setLinkModalOpen(false);
      } catch {
        toast('Selecciona todo el texto y cópialo con Ctrl+C / Cmd+C');
      }
    }
  };

  const updateHour = (dayOfWeek: number, field: string, value: any) => {
    setHours((prev) => {
      const currentHours = prev ?? [];
      const existingIndex = currentHours.findIndex(h => h?.dayOfWeek === dayOfWeek);
      
      if (existingIndex >= 0) {
        // Update existing hour
        return currentHours.map((h, idx) =>
          idx === existingIndex ? { ...h, [field]: value } : h
        );
      } else {
        // Add new hour if it doesn't exist
        return [
          ...currentHours,
          {
            dayOfWeek,
            isOpen: field === 'isOpen' ? value : false,
            openTime: field === 'openTime' ? value : '09:00',
            closeTime: field === 'closeTime' ? value : '23:00',
          },
        ];
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
          <Settings className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-sm text-gray-500">Configura tu negocio y horarios</p>
        </div>
      </div>

      {/* Business Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" /> Datos del Negocio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveBusiness} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                className="rounded-xl shadow-sm"
                label="Nombre del negocio"
                value={formData?.name ?? ''}
                onChange={(e) => setFormData({ ...formData, name: e.target?.value ?? '' })}
                required
              />
              <Input
                className="rounded-xl shadow-sm"
                label="Slug (URL)"
                value={formData?.slug ?? ''}
                onChange={(e) => setFormData({ ...formData, slug: e.target?.value?.toLowerCase()?.replace(/[^a-z0-9-]/g, '') ?? '' })}
                required
              />
            </div>

            {/* Public Link */}
            <div className="bg-violet-50 rounded-xl p-4">
              <p className="text-sm text-violet-700 mb-2">Link público de reservas:</p>
              <div className="flex items-center gap-2">
                <code className=" rounded-xl shadow-sm flex-1 bg-white px-3 py-2 text-sm text-gray-700 border border-violet-200 truncate">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/booking/{formData?.slug}
                </code>
                <Button className="rounded-xl shadow-sm" type="button" variant="outline" size="sm" onClick={copyLink}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                className="rounded-xl shadow-sm"
                label="Nombre del dueño"
                value={formData?.ownerName ?? ''}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target?.value ?? '' })}
              />
              <Input
                className="rounded-xl shadow-sm"
                label="Teléfono del dueño"
                value={formData?.ownerPhone ?? ''}
                onChange={(e) => setFormData({ ...formData, ownerPhone: e.target?.value ?? '' })}
              />
            </div>

            <Input
              className="rounded-xl shadow-sm"
              label="Teléfono del negocio"
              value={formData?.phone ?? ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target?.value ?? '' })}
            />

            <Input
              className="rounded-xl shadow-sm"
              label="Dirección"
              value={formData?.address ?? ''}
              onChange={(e) => setFormData({ ...formData, address: e.target?.value ?? '' })}
            />

            <Textarea
              className="rounded-xl shadow-sm"
              label="Descripción"
              value={formData?.description ?? ''}
              onChange={(e) => setFormData({ ...formData, description: e.target?.value ?? '' })}
              rows={3}
            />

            <Button type="submit" loading={saving} className="rounded-full shadow-sm">
              <Save className="w-4 h-4 mr-2" /> Guardar cambios
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Subscription */}
      {sub && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" /> Suscripción
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={subStatusBadge[sub.status]}>
                      {subStatusLabel[sub.status]}
                    </Badge>
                    <span className="text-sm font-semibold text-gray-900">
                      {fmtMoney(sub.monthlyPrice)} / mes
                    </span>
                  </div>
                  {sub.status === 'TRIAL' && sub.trialEndsAt && (
                    <p className="text-sm text-gray-600">
                      Tu prueba gratis termina el <strong>{fmtDate(sub.trialEndsAt)}</strong>
                      {(() => {
                        const d = daysUntil(sub.trialEndsAt);
                        if (d === null) return null;
                        if (d < 0) return ' (vencido)';
                        if (d === 0) return ' (hoy)';
                        return ` (en ${d} día${d === 1 ? '' : 's'})`;
                      })()}
                    </p>
                  )}
                  {(sub.status === 'ACTIVE' || sub.status === 'CANCELLED' || sub.status === 'PAST_DUE') && sub.paidUntil && (
                    <p className="text-sm text-gray-600">
                      Pago vigente hasta <strong>{fmtDate(sub.paidUntil)}</strong>
                    </p>
                  )}
                  {sub.lastPaymentAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Último pago: {fmtDate(sub.lastPaymentAt)}
                    </p>
                  )}
                </div>
                <div>
                  {sub.status === 'CANCELLED' ? (
                    <Button onClick={reactivateSubscription} loading={cancelLoading} className="rounded-full shadow-sm">
                      Reactivar suscripción
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setCancelModalOpen(true)}
                      className="rounded-full shadow-sm text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Dar de baja
                    </Button>
                  )}
                </div>
              </div>

              {sub.status === 'CANCELLED' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1 text-sm text-amber-900">
                    <p className="font-semibold">Cancelaste tu suscripción</p>
                    {sub.paidUntil && new Date(sub.paidUntil) > new Date() && (
                      <p className="mt-1">
                        Vas a poder seguir usando el servicio hasta el <strong>{fmtDate(sub.paidUntil)}</strong>. Después se desactiva.
                      </p>
                    )}
                    <p className="mt-1">¿Cambiaste de opinión? Podés volver atrás cuando quieras.</p>
                  </div>
                  <Button
                    onClick={reactivateSubscription}
                    loading={cancelLoading}
                    className="rounded-full shadow-sm bg-amber-600 hover:bg-amber-700 whitespace-nowrap"
                    size="sm"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" /> Reactivar
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mis pagos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" /> Mis pagos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-gray-500">
              Aún no registramos pagos. Acá vas a ver tu historial cuando empieces a pagar.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-gray-500 text-xs">
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 font-medium">Fecha</th>
                    <th className="text-right py-2 font-medium">Monto</th>
                    <th className="text-left py-2 font-medium">Método</th>
                    <th className="text-left py-2 font-medium">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50">
                      <td className="py-2 text-gray-700">{fmtDate(p.paidAt)}</td>
                      <td className="py-2 text-right font-medium text-green-700">{fmtMoney(p.amount)}</td>
                      <td className="py-2">
                        <Badge variant="default">
                          {p.method === 'MERCADOPAGO' ? 'MercadoPago' : 'Transferencia'}
                        </Badge>
                      </td>
                      <td className="py-2 text-gray-600 max-w-xs truncate" title={p.notes ?? ''}>
                        {p.notes ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" /> Horarios de Disponibilidad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 0].map((dayOfWeek) => {
              const dayHours = (hours ?? []).find((h) => h?.dayOfWeek === dayOfWeek) ?? {
                dayOfWeek,
                isOpen: false,
                openTime: '09:00',
                closeTime: '23:00',
              };

              return (
                <div
                  key={dayOfWeek}
                  className="flex flex-row items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-xl"
                >
                  <div className="w-16 sm:w-24 shrink-0">
                    <span className="font-medium text-gray-900 text-sm sm:text-base">{DAY_NAMES[dayOfWeek]}</span>
                  </div>
                  <Toggle
                    checked={dayHours?.isOpen ?? false}
                    onChange={(checked) => updateHour(dayOfWeek, 'isOpen', checked)}
                  />
                  {dayHours?.isOpen ? (
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 justify-end sm:justify-start">
                      <TimeInput
                        value={dayHours?.openTime ?? '09:00'}
                        onChange={(value) => updateHour(dayOfWeek, 'openTime', value)}
                        className="w-[84px] sm:w-32 rounded-xl shadow-sm"
                      />
                      <span className="text-gray-500 text-sm">a</span>
                      <TimeInput
                        value={dayHours?.closeTime ?? '23:00'}
                        onChange={(value) => updateHour(dayOfWeek, 'closeTime', value)}
                        className="w-[84px] sm:w-32 rounded-xl shadow-sm"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500 ml-auto">Cerrado</span>
                  )}
                </div>
              );
            })}
          </div>

          <Button className="rounded-full shadow-sm mt-6" onClick={handleSaveHours} loading={savingHours}>
            <Save className="w-4 h-4 mr-2" /> Guardar horarios
          </Button>
        </CardContent>
      </Card>

      {/* Zona de peligro */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" /> Zona de peligro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-3">
            Eliminar tu cuenta borra <strong>permanentemente</strong> tu negocio, todos los servicios, reservas, horarios, bloques recurrentes y pagos. Esta acción <strong>no se puede deshacer</strong>.
          </p>
          <button
            onClick={() => {
              setDeleteConfirmName('');
              setDeleteAccountOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-white hover:bg-red-50 border border-red-200 rounded-xl shadow-sm transition"
          >
            <Trash2 className="w-4 h-4" /> Eliminar mi cuenta y todos mis datos
          </button>
        </CardContent>
      </Card>

      {/* Modal eliminar cuenta */}
      <Modal
        isOpen={deleteAccountOpen}
        onClose={() => !deleteAccountLoading && setDeleteAccountOpen(false)}
        title="Eliminar mi cuenta"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              Vas a borrar <strong>permanentemente</strong>:
              <ul className="list-disc pl-5 mt-2 space-y-0.5">
                <li>Tu cuenta de usuario</li>
                <li>Tu negocio <strong>{business?.name}</strong></li>
                <li>Todos tus servicios y horarios</li>
                <li>Todas tus reservas (pasadas y futuras)</li>
                <li>Tus bloques recurrentes</li>
                <li>Tu suscripción y todos los pagos registrados</li>
              </ul>
              <p className="mt-2 font-semibold">Esto no se puede deshacer.</p>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">
              Para confirmar, escribí el nombre exacto de tu negocio: <strong>{business?.name}</strong>
            </label>
            <input
              type="text"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder={business?.name ?? ''}
              className="w-full rounded-xl border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => setDeleteAccountOpen(false)}
              disabled={deleteAccountLoading}
            >
              Cancelar
            </Button>
            <button
              onClick={deleteAccount}
              disabled={
                deleteAccountLoading ||
                deleteConfirmName.trim().toLowerCase() !== (business?.name ?? '').trim().toLowerCase()
              }
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteAccountLoading ? 'Eliminando…' : 'Sí, eliminar todo'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Cancel Subscription Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Dar de baja la suscripción"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              ¿Seguro que querés cancelar tu suscripción?
              {sub?.paidUntil && new Date(sub.paidUntil) > new Date() && (
                <> Vas a poder seguir usando el servicio hasta el <strong>{fmtDate(sub.paidUntil)}</strong>, después se va a desactivar.</>
              )}
              {sub?.status === 'TRIAL' && sub?.trialEndsAt && (
                <> Tu prueba gratis sigue vigente hasta el <strong>{fmtDate(sub.trialEndsAt)}</strong>.</>
              )}
              <br />
              Podés reactivar la suscripción en cualquier momento desde esta misma pantalla.
            </div>
          </div>

          {/* Razón de cancelación (opcional) */}
          <div>
            <label className="text-sm font-medium text-gray-900 block mb-2">
              ¿Por qué te das de baja? <span className="text-gray-400 font-normal">(opcional, nos ayuda a mejorar)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CANCEL_REASONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setCancelReason(cancelReason === r.value ? '' : r.value)}
                  className={`text-left px-3 py-2 rounded-xl border text-sm transition ${
                    cancelReason === r.value
                      ? 'border-violet-500 bg-violet-50 text-violet-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <textarea
              value={cancelReasonText}
              onChange={(e) => setCancelReasonText(e.target.value.slice(0, 1000))}
              placeholder="Contanos un poco más (opcional)…"
              rows={2}
              className="w-full mt-2 rounded-xl border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setCancelModalOpen(false)}>
              Mantener suscripción
            </Button>
            <button
              onClick={cancelSubscription}
              disabled={cancelLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50"
            >
              {cancelLoading ? 'Cancelando…' : 'Sí, dar de baja'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Link Copy Modal */}
      <Modal
        isOpen={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        title="Copiar Link Público"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Selecciona el link completo y cópialo manualmente (Ctrl+C / Cmd+C):
          </p>
          <input
            ref={linkInputRef}
            type="text"
            readOnly
            value={getPublicLink()}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />
          <div className="flex gap-3">
            <Button onClick={handleManualCopy} className="flex-1">
              <Copy className="w-4 h-4 mr-2" /> Copiar
            </Button>
            <Button variant="outline" onClick={() => setLinkModalOpen(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
