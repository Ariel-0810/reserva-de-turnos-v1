'use client';

import { useState, useEffect } from 'react';
import { Building2, RefreshCw, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Toggle } from '@/components/ui/toggle';
import { formatShortDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Business {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  user: { email: string; name: string };
  _count: { bookings: number; services: number };
}

export function BusinessesClient() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const toggleActive = async (id: string, isActive: boolean) => {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Negocios</h1>
            <p className="text-sm text-gray-500">Gestiona todos los negocios registrados</p>
          </div>
        </div>
        <Button onClick={fetchBusinesses} variant="secondary" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" /> Actualizar
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Cargando negocios...</div>
          ) : (businesses?.length ?? 0) === 0 ? (
            <div className="p-8 text-center text-gray-500">No hay negocios registrados</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {(businesses ?? []).map((business) => (
                <div key={business?.id} className="p-4 sm:p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{business?.name}</h3>
                        <Badge variant={business?.isActive ? 'success' : 'default'}>
                          {business?.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                          /booking/{business?.slug}
                        </span>
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Dueño: {business?.user?.name} ({business?.user?.email})
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Registrado: {formatShortDate(business?.createdAt)} •{' '}
                        {business?._count?.services ?? 0} servicios •{' '}
                        {business?._count?.bookings ?? 0} reservas
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Toggle
                        checked={business?.isActive ?? false}
                        onChange={(checked) => toggleActive(business?.id, checked)}
                        label={business?.isActive ? 'Activo' : 'Inactivo'}
                      />
                      <a
                        href={`/booking/${business?.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-violet-600"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
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
