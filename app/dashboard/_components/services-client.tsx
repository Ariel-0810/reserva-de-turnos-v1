'use client';

import { useState, useEffect } from 'react';
import { LayoutGrid, Plus, Edit2, Trash2, Clock, DollarSign, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Service {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: string;
  isActive: boolean;
}

export function ServicesClient() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    durationMinutes: '60',
    price: '',
    isActive: true,
  });

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar servicios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service?.name ?? '',
        description: service?.description ?? '',
        durationMinutes: String(service?.durationMinutes ?? 60),
        price: service?.price ?? '',
        isActive: service?.isActive ?? true,
      });
    } else {
      setEditingService(null);
      setFormData({ name: '', description: '', durationMinutes: '60', price: '', isActive: true });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingService ? `/api/services/${editingService.id}` : '/api/services';
      const method = editingService ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Error');
      }

      toast.success(editingService ? 'Servicio actualizado' : 'Servicio creado');
      setModalOpen(false);
      fetchServices();
    } catch (error: any) {
      toast.error(error?.message || 'Error al guardar servicio');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este servicio?')) return;

    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Servicio eliminado');
      fetchServices();
    } catch {
      toast.error('Error al eliminar servicio');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Servicios</h1>
            <p className="text-sm text-gray-500">Configura los servicios que ofreces</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="rounded-full shadow-sm" onClick={fetchServices} variant="secondary" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" /> Actualizar
          </Button>
          <Button className="rounded-full shadow-sm" onClick={() => openModal()} size="sm">
            <Plus className="w-4 h-4 mr-2" /> Agregar Servicio
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Cargando servicios...</div>
          ) : (services?.length ?? 0) === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <LayoutGrid className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No tienes servicios configurados</p>
              <Button onClick={() => openModal()} className="mt-4" size="sm">
                <Plus className="w-4 h-4 mr-2" /> Crear primer servicio
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {(services ?? []).map((service) => (
                <div
                  key={service?.id}
                  className="p-4 sm:p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{service?.name}</h3>
                        <Badge variant={service?.isActive ? 'success' : 'default'}>
                          {service?.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      {service?.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{service?.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" /> {service?.durationMinutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" /> {formatPrice(service?.price)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openModal(service)}>
                        <Edit2 className="w-4 h-4 mr-1" /> Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(service?.id)}>
                        <Trash2 className="w-4 h-4 mr-1 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            className="rounded-xl shadow-sm"
            label="Nombre del servicio"
            value={formData?.name ?? ''}
            onChange={(e) => setFormData({ ...formData, name: e.target?.value ?? '' })}
            placeholder="Ej: Corte de cabello"
            required
          />

          <Textarea
            className="rounded-xl shadow-sm"
            label="Descripción (opcional)"
            value={formData?.description ?? ''}
            onChange={(e) => setFormData({ ...formData, description: e.target?.value ?? '' })}
            placeholder="Describe el servicio..."
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              className="rounded-xl shadow-sm"
              label="Duración (minutos)"
              type="number"
              value={formData?.durationMinutes ?? '60'}
              onChange={(e) => setFormData({ ...formData, durationMinutes: e.target?.value ?? '60' })}
              min="15"
              step="15"
              required
            />

            <Input
              className="rounded-xl shadow-sm"
              label="Precio"
              type="number"
              value={formData?.price ?? ''}
              onChange={(e) => setFormData({ ...formData, price: e.target?.value ?? '' })}
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="pt-2">
            <Toggle
              checked={formData?.isActive ?? true}
              onChange={(checked) => setFormData({ ...formData, isActive: checked })}
              label="Servicio activo (visible para clientes)"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1 rounded-xl" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 rounded-xl" loading={saving}>
              {editingService ? 'Guardar cambios' : 'Crear servicio'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
