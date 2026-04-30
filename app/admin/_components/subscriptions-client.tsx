'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  CreditCard, RefreshCw, DollarSign, Pause, Play, X, Edit3, MoreVertical, ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type SubStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED';

interface Subscription {
  id: string;
  businessId: string;
  business: { id: string; name: string; slug: string; isActive: boolean } | null;
  status: SubStatus;
  monthlyPrice: number;
  trialEndsAt: string | null;
  paidUntil: string | null;
  lastPaymentAt: string | null;
  daysUntilExpiry: number | null;
  createdAt: string;
}

type Filter = 'all' | 'trial' | 'active' | 'expiring' | 'past_due' | 'suspended' | 'cancelled';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'trial', label: 'Trial' },
  { key: 'active', label: 'Activos' },
  { key: 'expiring', label: 'Por vencer (7d)' },
  { key: 'past_due', label: 'Morosos' },
  { key: 'suspended', label: 'Suspendidos' },
  { key: 'cancelled', label: 'Cancelados' },
];

const statusBadge: Record<SubStatus, string> = {
  TRIAL: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-green-100 text-green-700',
  PAST_DUE: 'bg-amber-100 text-amber-700',
  SUSPENDED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-200 text-gray-700',
};

const statusLabel: Record<SubStatus, string> = {
  TRIAL: 'Trial',
  ACTIVE: 'Activo',
  PAST_DUE: 'Moroso',
  SUSPENDED: 'Suspendido',
  CANCELLED: 'Cancelado',
};

function fmtDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtMoney(n: number): string {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}

export function SubscriptionsClient() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [mrr, setMrr] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [paymentSub, setPaymentSub] = useState<Subscription | null>(null);
  const [priceSub, setPriceSub] = useState<Subscription | null>(null);

  const fetchSubs = async (f: Filter = filter) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/subscriptions?status=${f}`);
      const data = await res.json();
      setSubs(Array.isArray(data?.subscriptions) ? data.subscriptions : []);
      setMrr(data?.mrr ?? 0);
    } catch {
      toast.error('Error al cargar suscripciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubs(filter); /* eslint-disable-next-line */ }, [filter]);

  const counts = useMemo(() => {
    const c = { trial: 0, active: 0, past_due: 0, suspended: 0, cancelled: 0 };
    subs.forEach((s) => {
      if (s.status === 'TRIAL') c.trial++;
      else if (s.status === 'ACTIVE') c.active++;
      else if (s.status === 'PAST_DUE') c.past_due++;
      else if (s.status === 'SUSPENDED') c.suspended++;
      else if (s.status === 'CANCELLED') c.cancelled++;
    });
    return c;
  }, [subs]);

  const action = async (id: string, body: any, successMsg: string) => {
    try {
      const res = await fetch(`/api/admin/subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast.success(successMsg);
      fetchSubs();
    } catch {
      toast.error('Error');
    } finally {
      setOpenMenu(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="w-6 h-6" /> Suscripciones
          </h1>
          <p className="text-sm text-gray-500">Gestión de planes y cobros</p>
        </div>
        <Button className="rounded-full shadow-sm" variant="secondary" onClick={() => fetchSubs()} disabled={loading}>
          <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
          Actualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <div className="text-xs text-gray-500">MRR proyectado</div>
          <div className="text-xl font-bold text-green-600 flex items-center gap-1">
            <DollarSign className="w-4 h-4" />{fmtMoney(mrr)}
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-gray-500">En Trial</div>
          <div className="text-xl font-bold">{counts.trial}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-gray-500">Activos</div>
          <div className="text-xl font-bold text-green-600">{counts.active}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-gray-500">Morosos / Suspendidos</div>
          <div className="text-xl font-bold text-amber-600">{counts.past_due + counts.suspended}</div>
        </CardContent></Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition',
              filter === f.key
                ? 'bg-slate-900 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Negocio</th>
                <th className="text-left px-4 py-3 font-medium">Estado</th>
                <th className="text-right px-4 py-3 font-medium">Precio mensual</th>
                <th className="text-left px-4 py-3 font-medium">Vence</th>
                <th className="text-left px-4 py-3 font-medium">Última paga</th>
                <th className="text-right px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Cargando…</td></tr>
              ) : subs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Sin resultados</td></tr>
              ) : (
                subs.map((s) => {
                  const venceLabel =
                    s.status === 'TRIAL' ? fmtDate(s.trialEndsAt) :
                    s.paidUntil ? fmtDate(s.paidUntil) : '—';
                  const venceWarn = s.daysUntilExpiry != null && s.daysUntilExpiry <= 7 && s.daysUntilExpiry >= 0;
                  const venceExpired = s.daysUntilExpiry != null && s.daysUntilExpiry < 0;
                  return (
                    <tr key={s.id} className="border-t border-gray-100">
                      <td className="px-4 py-3">
                        <div className="font-medium">{s.business?.name ?? <i className="text-gray-400">—</i>}</div>
                        {s.business?.slug && (
                          <Link
                            href={`/booking/${s.business.slug}`}
                            target="_blank"
                            className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                          >
                            /{s.business.slug} <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={statusBadge[s.status]}>{statusLabel[s.status]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{fmtMoney(s.monthlyPrice)}</td>
                      <td className={cn('px-4 py-3', venceExpired && 'text-red-600 font-medium', venceWarn && 'text-amber-600')}>
                        {venceLabel}
                        {s.daysUntilExpiry != null && (
                          <span className="text-xs text-gray-500 ml-1">
                            ({s.daysUntilExpiry >= 0 ? `en ${s.daysUntilExpiry}d` : `hace ${-s.daysUntilExpiry}d`})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{fmtDate(s.lastPaymentAt)}</td>
                      <td className="px-4 py-3 text-right relative">
                        <div className="inline-flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPaymentSub(s)}
                            title="Registrar pago"
                            className="h-8 w-8 p-0 rounded-xl shadow-sm bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                          >
                            <DollarSign className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setOpenMenu(openMenu === s.id ? null : s.id)}
                            className="h-8 w-8 p-0 rounded-xl shadow-sm border-gray-300 hover:bg-gray-100 transition"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                        {openMenu === s.id && (
                          <div className="absolute right-4 top-12 z-10 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-left">
                            <button
                              className="w-full px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                              onClick={() => { setPriceSub(s); setOpenMenu(null); }}
                            >
                              <Edit3 className="w-4 h-4" /> Cambiar precio
                            </button>
                            {s.status !== 'SUSPENDED' && s.status !== 'CANCELLED' && (
                              <button
                                className="w-full px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-amber-700"
                                onClick={() => action(s.id, { action: 'suspend' }, 'Suscripción suspendida')}
                              >
                                <Pause className="w-4 h-4" /> Suspender
                              </button>
                            )}
                            {(s.status === 'SUSPENDED' || s.status === 'CANCELLED') && (
                              <button
                                className="w-full px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-green-700"
                                onClick={() => action(s.id, { action: 'reactivate' }, 'Suscripción reactivada')}
                              >
                                <Play className="w-4 h-4" /> Reactivar
                              </button>
                            )}
                            {s.status !== 'CANCELLED' && (
                              <button
                                className="w-full px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-red-700"
                                onClick={() => {
                                  if (confirm('¿Cancelar esta suscripción? El negocio quedará desactivado.')) {
                                    action(s.id, { action: 'cancel' }, 'Suscripción cancelada');
                                  }
                                }}
                              >
                                <X className="w-4 h-4" /> Cancelar
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Modal pago */}
      {paymentSub && (
        <PaymentModal
          subscription={paymentSub}
          onClose={() => setPaymentSub(null)}
          onSuccess={() => { setPaymentSub(null); fetchSubs(); }}
        />
      )}

      {/* Modal precio */}
      {priceSub && (
        <PriceModal
          subscription={priceSub}
          onClose={() => setPriceSub(null)}
          onSuccess={() => { setPriceSub(null); fetchSubs(); }}
        />
      )}
    </div>
  );
}

function PaymentModal({
  subscription,
  onClose,
  onSuccess,
}: {
  subscription: Subscription;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState(String(subscription.monthlyPrice || ''));
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState<'MANUAL_TRANSFER' | 'MERCADOPAGO'>('MANUAL_TRANSFER');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/subscriptions/${subscription.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, paidAt, method, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error');
      const newPaidUntil = data?.subscription?.paidUntil
        ? new Date(data.subscription.paidUntil).toLocaleDateString('es-AR')
        : '';
      toast.success(`Pago registrado. Vence ${newPaidUntil}`);
      onSuccess();
    } catch (e: any) {
      toast.error(e?.message || 'Error al registrar pago');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Registrar pago — ${subscription.business?.name ?? ''}`}>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-600">Monto (ARS)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600">Fecha de pago</label>
          <input
            type="date"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600">Método</label>
          <div className="flex gap-3 mt-1">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={method === 'MANUAL_TRANSFER'}
                onChange={() => setMethod('MANUAL_TRANSFER')}
              /> Transferencia
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={method === 'MERCADOPAGO'}
                onChange={() => setMethod('MERCADOPAGO')}
              /> MercadoPago
            </label>
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-600">Notas (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
            rows={2}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button className="rounded-full shadow-sm" variant="outline" onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button className="rounded-full shadow-sm" onClick={submit} disabled={submitting}>
            {submitting ? 'Registrando…' : 'Registrar pago'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function PriceModal({
  subscription,
  onClose,
  onSuccess,
}: {
  subscription: Subscription;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [price, setPrice] = useState(String(subscription.monthlyPrice || ''));
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/subscriptions/${subscription.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change_price', monthlyPrice: price }),
      });
      if (!res.ok) throw new Error();
      toast.success('Precio actualizado');
      onSuccess();
    } catch {
      toast.error('Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Cambiar precio mensual">
      <div className="space-y-3">
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button onClick={submit} disabled={submitting}>Guardar</Button>
        </div>
      </div>
    </Modal>
  );
}
