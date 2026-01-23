'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Building2, CalendarCheck, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import toast from 'react-hot-toast';

interface Stats {
  totalBusinesses: number;
  activeBusinesses: number;
  inactiveBusinesses: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
}

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
    {
      label: 'Total Negocios',
      value: stats?.totalBusinesses ?? 0,
      icon: Building2,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Negocios Activos',
      value: stats?.activeBusinesses ?? 0,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'Negocios Inactivos',
      value: stats?.inactiveBusinesses ?? 0,
      icon: XCircle,
      color: 'bg-gray-100 text-gray-600',
    },
    {
      label: 'Total Reservas',
      value: stats?.totalBookings ?? 0,
      icon: CalendarCheck,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'Reservas Pendientes',
      value: stats?.pendingBookings ?? 0,
      icon: Clock,
      color: 'bg-amber-100 text-amber-600',
    },
    {
      label: 'Reservas Confirmadas',
      value: stats?.confirmedBookings ?? 0,
      icon: CheckCircle,
      color: 'bg-violet-100 text-violet-600',
    },
  ];

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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((stat, idx) => (
            <Card key={idx}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat?.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{stat?.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat?.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
