'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3, Building2, CalendarCheck, Clock, CheckCircle, XCircle,
  TrendingUp, TrendingDown, Sparkles, Ban, Trophy, AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatShortDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface MonthRow { month: string; count: number }
interface TopRow { id: string; name: string; slug: string; bookings: number }
interface InactiveRow { id: string; name: string; slug: string; createdAt: string; isActive: boolean }

interface Stats {
  totalBusinesses: number;
  activeBusinesses: number;
  inactiveBusinesses: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  cancellationRate: number;
  newBusinessesThisWeek: number;
  bookingsThisWeek: number;
  bookingsPrevWeek: number;
  bookingsWoWPct: number | null;
  bookingsByMonth: MonthRow[];
  topBusinesses: TopRow[];
  inactiveBusinesses30d: InactiveRow[];
}

const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-');
  const names = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${names[Number(m) - 1] ?? m}/${y.slice(2)}`;
};

export function StatsClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data);
    } catch {
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Negocios', value: stats?.totalBusinesses ?? 0, icon: Building2, color: 'bg-blue-100 text-blue-600' },
    { label: 'Negocios Activos', value: stats?.activeBusinesses ?? 0, icon: CheckCircle, color: 'bg-green-100 text-green-600' },
    { label: 'Negocios Inactivos', value: stats?.inactiveBusinesses ?? 0, icon: XCircle, color: 'bg-gray-100 text-gray-600' },
    { label: 'Total Reservas', value: stats?.totalBookings ?? 0, icon: CalendarCheck, color: 'bg-purple-100 text-purple-600' },
    { label: 'Reservas Pendientes', value: stats?.pendingBookings ?? 0, icon: Clock, color: 'bg-amber-100 text-amber-600' },
    { label: 'Reservas Confirmadas', value: stats?.confirmedBookings ?? 0, icon: CheckCircle, color: 'bg-violet-100 text-violet-600' },
    { label: 'Canceladas', value: stats?.cancelledBookings ?? 0, icon: Ban, color: 'bg-red-100 text-red-600' },
    { label: 'Tasa cancelación', value: `${stats?.cancellationRate ?? 0}%`, icon: BarChart3, color: 'bg-orange-100 text-orange-600' },
  ];

  const maxMonth = Math.max(1, ...(stats?.bookingsByMonth ?? []).map((m) => m.count));
  const wow = stats?.bookingsWoWPct;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estadísticas del Sistema</h1>
          <p className="text-sm text-gray-500">Vista general de la plataforma</p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Cargando estadísticas...</div>
      ) : (
        <>
          {/* Growth banner */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Negocios nuevos esta semana</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.newBusinessesThisWeek ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    wow == null ? 'bg-gray-100 text-gray-600' : wow >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {wow != null && wow < 0 ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Reservas esta semana</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-gray-900">{stats?.bookingsThisWeek ?? 0}</p>
                      {wow != null && (
                        <span className={`text-sm font-medium ${wow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {wow >= 0 ? '+' : ''}{wow}% vs anterior
                        </span>
                      )}
                      {wow == null && stats?.bookingsPrevWeek === 0 && (
                        <span className="text-xs text-gray-400">sin base anterior</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">Semana anterior: {stats?.bookingsPrevWeek ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stat cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, idx) => (
              <Card key={idx}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                      <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Breakdown por mes */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-900">Reservas por mes (últimos 6)</h3>
              </div>
              {(stats?.bookingsByMonth ?? []).length === 0 ? (
                <p className="text-sm text-gray-500">Sin datos suficientes.</p>
              ) : (
                <div className="space-y-2">
                  {(stats?.bookingsByMonth ?? []).map((m) => (
                    <div key={m.month} className="flex items-center gap-3">
                      <div className="w-16 text-xs text-gray-500 font-medium">{monthLabel(m.month)}</div>
                      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-violet-500 h-full rounded-full"
                          style={{ width: `${(m.count / maxMonth) * 100}%` }}
                        />
                      </div>
                      <div className="w-12 text-right text-sm font-semibold text-gray-700">{m.count}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Top 3 negocios */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <h3 className="font-semibold text-gray-900">Top 3 negocios por uso</h3>
                </div>
                {(stats?.topBusinesses ?? []).length === 0 ? (
                  <p className="text-sm text-gray-500">Sin reservas todavía.</p>
                ) : (
                  <div className="space-y-2">
                    {(stats?.topBusinesses ?? []).map((b, idx) => (
                      <div key={b.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                        <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-sm">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{b.name}</p>
                          <p className="text-xs text-gray-500 truncate">/booking/{b.slug}</p>
                        </div>
                        <span className="text-sm font-bold text-violet-600">{b.bookings} reservas</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Inactivos 30d */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h3 className="font-semibold text-gray-900">Sin actividad 30+ días</h3>
                </div>
                {(stats?.inactiveBusinesses30d ?? []).length === 0 ? (
                  <p className="text-sm text-gray-500">Todos los negocios tienen actividad reciente. 🎉</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {(stats?.inactiveBusinesses30d ?? []).map((b) => (
                      <div key={b.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{b.name}</p>
                          <p className="text-xs text-gray-500">
                            Registrado {formatShortDate(b.createdAt)} • {b.isActive ? 'Activo' : 'Inactivo'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
