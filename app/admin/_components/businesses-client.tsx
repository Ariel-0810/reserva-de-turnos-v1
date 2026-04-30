'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Building2, RefreshCw, ExternalLink, Search, Mail, MessageCircle,
  Eye, Filter, ArrowUpDown, AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Toggle } from '@/components/ui/toggle';
import { Modal } from '@/components/ui/modal';
import { cn, formatShortDate, timeAgo } from '@/lib/utils';
import { STATUS_LABELS, BookingStatus } from '@/lib/types';
import toast from 'react-hot-toast';

interface Business {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  lastBookingAt: string | null;
  user: { email: string; name: string; phone?: string | null } | null;
  _count: { bookings: number; services: number };
}

interface DetailHours { dayOfWeek: number; isOpen: boolean; openTime: string; closeTime: string }
interface DetailService { id: string; name: string; price: string; durationMinutes: number }
interface DetailBooking {
  id: string; uniqueId: string; customerName: string; customerPhone: string;
  bookingDate: string; startTime: string; endTime: string; status: BookingStatus; createdAt: string;
  service: { name: string; price: string } | null;
}
interface BusinessDetail {
  business: Business;
  user: { name: string; email: string; phone?: string | null } | null;
  services: DetailService[];
  hours: DetailHours[];
  recentBookings: DetailBooking[];
}

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

type SortBy = 'createdAt' | 'bookings' | 'lastActivity';
type StatusFilter = 'all' | 'active' | 'inactive';

export function BusinessesClient() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');

  const [confirmToggle, setConfirmToggle] = useState<{ id: string; name: string } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<BusinessDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<'services' | 'hours' | 'bookings'>('services');

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/businesses');
      const data = await res.json();
      setBusinesses(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Error al cargar negocios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBusinesses(); }, []);

  const fetchDetail = async (id: string) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetch(`/api/admin/businesses/${id}/details`);
      const data = await res.json();
      setDetail(data);
    } catch {
      toast.error('Error al cargar detalle');
    } finally {
      setDetailLoading(false);
    }
  };

  const openDetail = (id: string) => {
    setDetailId(id);
    setDetailTab('services');
    fetchDetail(id);
  };
  const closeDetail = () => {
    setDetailId(null);
    setDetail(null);
  };

  const setActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/businesses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error();
      toast.success(isActive ? 'Negocio activado' : 'Negocio desactivado');
      fetchBusinesses();
    } catch {
      toast.error('Error al actualizar negocio');
    }
  };

  const onToggleClick = (b: Business, checked: boolean) => {
    if (b.isActive && !checked) {
      // Desactivando un negocio activo → confirmar
      setConfirmToggle({ id: b.id, name: b.name });
    } else {
      setActive(b.id, checked);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let arr = businesses.filter((b) => {
      if (statusFilter === 'active' && !b.isActive) return false;
      if (statusFilter === 'inactive' && b.isActive) return false;
      if (q) {
        const hay =
          b.name.toLowerCase().includes(q) ||
          (b.user?.email ?? '').toLowerCase().includes(q) ||
          (b.user?.name ?? '').toLowerCase().includes(q) ||
          b.slug.toLowerCase().includes(q);
        if (!hay) return false;
      }
      return true;
    });
    arr = [...arr];
    arr.sort((a, b) => {
      if (sortBy === 'bookings') return (b._count?.bookings ?? 0) - (a._count?.bookings ?? 0);
      if (sortBy === 'lastActivity') {
        const ta = a.lastBookingAt ? new Date(a.lastBookingAt).getTime() : 0;
        const tb = b.lastBookingAt ? new Date(b.lastBookingAt).getTime() : 0;
        return tb - ta;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return arr;
  }, [businesses, search, statusFilter, sortBy]);

  const buildWaLink = (phone: string | null | undefined, name: string) => {
    if (!phone) return null;
    const clean = phone.replace(/[^\d]/g, '');
    if (!clean) return null;
    const text = encodeURIComponent(`Hola ${name}, te escribo desde BookingSaaS.`);
    return `https://wa.me/${clean}?text=${text}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Negocios</h1>
            <p className="text-sm text-gray-500">
              {filtered.length} {filtered.length === 1 ? 'negocio' : 'negocios'} {search || statusFilter !== 'all' ? `de ${businesses.length}` : ''}
            </p>
          </div>
        </div>
        <Button className="rounded-full shadow-sm" onClick={fetchBusinesses} variant="secondary" size="sm">
          <RefreshCw className="w-4 h-4 mr-2"/> Actualizar
        </Button>
      </div>

      {/* Search + filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, slug o email del dueño..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 bg-white rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
          />
        </div>
        <div className="flex gap-2">
          {([
            { v: 'all', label: 'Todos' },
            { v: 'active', label: 'Activos' },
            { v: 'inactive', label: 'Inactivos' },
          ] as const).map((f) => (
            <button
              key={f.v}
              onClick={() => setStatusFilter(f.v)}
              className={cn(
                'px-3 py-2 rounded-xl text-sm font-medium transition-all',
                statusFilter === f.v
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 shadow-sm"
          >
            <option value="createdAt">Más recientes</option>
            <option value="bookings"># Reservas</option>
            <option value="lastActivity">Última actividad</option>
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Cargando negocios...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {businesses.length === 0 ? 'No hay negocios registrados' : 'Ningún negocio coincide con los filtros'}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((b) => {
                const waLink = buildWaLink(b.user?.phone, b.user?.name ?? '');
                return (
                  <div key={b.id} className="p-4 sm:p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{b.name}</h3>
                          <Badge variant={b.isActive ? 'success' : 'default'}>
                            {b.isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                            /booking/{b.slug}
                          </span>
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Dueño: {b.user?.name} ({b.user?.email})
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Registrado {formatShortDate(b.createdAt)} •{' '}
                          {b._count?.services ?? 0} servicios •{' '}
                          {b._count?.bookings ?? 0} reservas •{' '}
                          Última actividad: {b.lastBookingAt ? timeAgo(b.lastBookingAt) : 'nunca'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => openDetail(b.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-xl shadow-sm border border-violet-200"
                          title="Ver detalle"
                        >
                          <Eye className="w-3.5 h-3.5" /> Detalle
                        </button>
                        <a
                          href={`mailto:${b.user?.email ?? ''}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl shadow-sm border border-blue-200"
                          title="Email al dueño"
                        >
                          <Mail className="w-3.5 h-3.5" /> Email
                        </a>
                        {waLink ? (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-xl shadow-sm border border-green-200"
                            title="WhatsApp al dueño"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                          </a>
                        ) : null}
                        <Toggle
                          checked={b.isActive}
                          onChange={(checked) => onToggleClick(b, checked)}
                          label={b.isActive ? 'Activo' : 'Inactivo'}
                        />
                        <a
                          href={`/booking/${b.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-violet-600"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal confirmación desactivar */}
      <Modal
        isOpen={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        title="Desactivar negocio"
        size="sm"
      >
        {confirmToggle && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                Vas a desactivar <strong>{confirmToggle.name}</strong>. Esto cierra el link público inmediatamente y los clientes no podrán reservar.
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setConfirmToggle(null)}>
                Cancelar
              </Button>
              <button
                onClick={() => {
                  setActive(confirmToggle.id, false);
                  setConfirmToggle(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                Sí, desactivar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal detalle del negocio */}
      <Modal
        isOpen={!!detailId}
        onClose={closeDetail}
        title={detail?.business?.name ?? 'Detalle del negocio'}
        size="xl"
      >
        {detailLoading ? (
          <div className="py-8 text-center text-gray-500">Cargando detalle...</div>
        ) : !detail ? (
          <div className="py-8 text-center text-gray-500">Sin datos</div>
        ) : (
          <div className="space-y-4">
            {/* Info básica */}
            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <p><strong>Slug:</strong> /booking/{detail.business.slug}</p>
              <p><strong>Dueño:</strong> {detail.user?.name} • {detail.user?.email}{detail.user?.phone ? ` • ${detail.user.phone}` : ''}</p>
              <p><strong>Estado:</strong> {detail.business.isActive ? 'Activo' : 'Inactivo'} • Registrado {formatShortDate(detail.business.createdAt)}</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
              {([
                { v: 'services', label: `Servicios (${detail.services.length})` },
                { v: 'hours', label: 'Horarios' },
                { v: 'bookings', label: `Últimas reservas (${detail.recentBookings.length})` },
              ] as const).map((t) => (
                <button
                  key={t.v}
                  onClick={() => setDetailTab(t.v)}
                  className={cn(
                    'px-3 py-2 text-sm font-medium border-b-2 -mb-px',
                    detailTab === t.v
                      ? 'border-violet-600 text-violet-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="max-h-[50vh] overflow-y-auto">
              {detailTab === 'services' && (
                detail.services.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4">Sin servicios cargados.</p>
                ) : (
                  <div className="space-y-2">
                    {detail.services.map((s) => (
                      <div key={s.id} className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{s.name}</p>
                          <p className="text-xs text-gray-500">{s.durationMinutes} min</p>
                        </div>
                        <span className="text-sm font-semibold text-violet-600">${Number(s.price).toLocaleString('es-AR')}</span>
                      </div>
                    ))}
                  </div>
                )
              )}

              {detailTab === 'hours' && (
                detail.hours.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4">Sin horarios configurados.</p>
                ) : (
                  <div className="space-y-1">
                    {[1, 2, 3, 4, 5, 6, 0].map((dow) => {
                      const h = detail.hours.find((x) => x.dayOfWeek === dow);
                      return (
                        <div key={dow} className="flex justify-between text-sm py-1.5 px-2 border-b border-gray-100">
                          <span className="font-medium text-gray-700">{dayNames[dow]}</span>
                          {h?.isOpen ? (
                            <span className="text-gray-600">{h.openTime} – {h.closeTime}</span>
                          ) : (
                            <span className="text-gray-400">Cerrado</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {detailTab === 'bookings' && (
                detail.recentBookings.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4">Sin reservas.</p>
                ) : (
                  <div className="space-y-2">
                    {detail.recentBookings.map((bk) => (
                      <div key={bk.id} className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                              #{bk.uniqueId}
                            </span>
                            <Badge
                              variant={
                                bk.status === 'CONFIRMED' ? 'success'
                                : bk.status === 'PENDING' ? 'warning'
                                : 'default'
                              }
                            >
                              {STATUS_LABELS[bk.status]}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-400">{timeAgo(bk.createdAt)}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mt-1">{bk.customerName}</p>
                        <p className="text-xs text-gray-500">
                          {bk.service?.name ?? '—'} • {formatShortDate(bk.bookingDate)} • {bk.startTime}-{bk.endTime}
                        </p>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
