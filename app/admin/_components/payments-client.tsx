'use client';

import { useState, useEffect } from 'react';
import { Receipt, RefreshCw, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface PaymentRow {
  id: string;
  subscriptionId: string;
  businessId: string;
  amount: number;
  currency: string;
  method: 'MANUAL_TRANSFER' | 'MERCADOPAGO';
  externalRef: string | null;
  paidAt: string;
  notes: string | null;
  business: { id: string; name: string; slug: string } | null;
  createdByUser: { id: string; name: string; email: string } | null;
  createdAt: string;
}

function fmtDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtMoney(n: number): string {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}
function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function PaymentsClient() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(currentMonth());
  const [method, setMethod] = useState<'all' | 'MANUAL_TRANSFER' | 'MERCADOPAGO'>('all');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (month) params.set('month', month);
      if (method !== 'all') params.set('method', method);
      const res = await fetch(`/api/admin/payments?${params}`);
      const data = await res.json();
      setPayments(Array.isArray(data?.payments) ? data.payments : []);
      setTotal(data?.totalAmount ?? 0);
    } catch {
      toast.error('Error al cargar pagos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); /* eslint-disable-next-line */ }, [month, method]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="w-6 h-6" /> Pagos
          </h1>
          <p className="text-sm text-gray-500">Historial de cobros registrados</p>
        </div>
        <Button className="rounded-full shadow-sm" variant="secondary" onClick={fetchPayments} disabled={loading}>
          <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card><CardContent className="p-4">
          <div className="text-xs text-gray-500">Ingresos del periodo</div>
          <div className="text-xl font-bold text-green-600 flex items-center gap-1">
            <DollarSign className="w-4 h-4" />{fmtMoney(total)}
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-gray-500">Pagos</div>
          <div className="text-xl font-bold">{payments.length}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-gray-500">Promedio</div>
          <div className="text-xl font-bold">
            {payments.length > 0 ? fmtMoney(total / payments.length) : '—'}
          </div>
        </CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-gray-600 block">Mes</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-xl shadow-sm px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 block">Método</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as any)}
            className="rounded-xl shadow-sm px-3 py-2 text-sm"
          >
            <option value="all">Todos</option>
            <option value="MANUAL_TRANSFER">Transferencia</option>
            <option value="MERCADOPAGO">MercadoPago</option>
          </select>
        </div>
        <Button className="rounded-xl shadow-sm" variant="secondary" onClick={() => { setMonth(''); setMethod('all'); }}>
          Limpiar
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Fecha</th>
                <th className="text-left px-4 py-3 font-medium">Negocio</th>
                <th className="text-right px-4 py-3 font-medium">Monto</th>
                <th className="text-left px-4 py-3 font-medium">Método</th>
                <th className="text-left px-4 py-3 font-medium">Registrado por</th>
                <th className="text-left px-4 py-3 font-medium">Notas</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Cargando…</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Sin pagos en este filtro</td></tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">{fmtDate(p.paidAt)}</td>
                    <td className="px-4 py-3">
                      {p.business ? (
                        <Link href={`/booking/${p.business.slug}`} target="_blank" className="font-medium hover:underline">
                          {p.business.name}
                        </Link>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-green-700">{fmtMoney(p.amount)}</td>
                    <td className="px-4 py-3">
                      <Badge className={p.method === 'MERCADOPAGO' ? 'bg-sky-100 text-sky-700' : 'bg-gray-100 text-gray-700'}>
                        {p.method === 'MERCADOPAGO' ? 'MercadoPago' : 'Transferencia'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.createdByUser?.name ?? p.createdByUser?.email ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={p.notes ?? ''}>
                      {p.notes ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
