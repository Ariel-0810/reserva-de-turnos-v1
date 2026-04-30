'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  CalendarClock, Plus, Pencil, Trash2, Pause, Play, RefreshCw, AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

interface Service {
  id: string;
  name: string;
}

interface RecurringBlock {
  id: string;
  businessId: string;
  serviceId: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  label: string | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
}

interface FormState {
  id?: string;
  serviceId: string;       // '' = todos los servicios
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  label: string;
  startDate: string;
  endDate: string;
}

const emptyForm: FormState = {
  serviceId: '',
  dayOfWeek: 1,
  startTime: '21:00',
  endTime: '22:00',
  label: '',
  startDate: '',
  endDate: '',
};

export function RecurringClient() {
  const [blocks, setBlocks] = useState<RecurringBlock[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<RecurringBlock | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [blocksRes, servicesRes] = await Promise.all([
        fetch('/api/business/recurring-blocks'),
        fetch('/api/services'),
      ]);
      const blocksData = await blocksRes.json();
      const servicesData = await servicesRes.json();
      setBlocks(Array.isArray(blocksData?.blocks) ? blocksData.blocks : []);
      setServices(
        Array.isArray(servicesData?.services)
          ? servicesData.services
          : Array.isArray(servicesData)
          ? servicesData
          : []
      );
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const grouped = useMemo(() => {
    const map: Record<number, RecurringBlock[]> = {};
    for (let i = 0; i < 7; i++) map[i] = [];
    blocks.forEach((b) => map[b.dayOfWeek].push(b));
    return map;
  }, [blocks]);

  const openNew = () => {
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (b: RecurringBlock) => {
    setForm({
      id: b.id,
      serviceId: b.serviceId ?? '',
      dayOfWeek: b.dayOfWeek,
      startTime: b.startTime,
      endTime: b.endTime,
      label: b.label ?? '',
      startDate: b.startDate ?? '',
      endDate: b.endDate ?? '',
    });
    setModalOpen(true);
  };

  const submit = async () => {
    if (form.startTime >= form.endTime) {
      toast.error('La hora de inicio debe ser menor a la de fin');
      return;
    }
    setSaving(true);
    try {
      const isEdit = !!form.id;
      const url = isEdit
        ? `/api/business/recurring-blocks/${form.id}`
        : '/api/business/recurring-blocks';
      const method = isEdit ? 'PUT' : 'POST';

      const body = {
        serviceId: form.serviceId === '' ? null : form.serviceId,
        dayOfWeek: form.dayOfWeek,
        startTime: form.startTime,
        endTime: form.endTime,
        label: form.label.trim() === '' ? null : form.label.trim(),
        startDate: form.startDate === '' ? null : form.startDate,
        endDate: form.endDate === '' ? null : form.endDate,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error ?? 'Error al guardar');
        return;
      }

      if (data?.conflictWarning) {
        toast(
          `⚠️ Bloque guardado. Hay ${data.conflictWarning} reserva(s) futura(s) en conflicto — revisalas y contactá a los clientes.`,
          { duration: 6000 }
        );
      } else {
        toast.success(isEdit ? 'Bloque actualizado' : 'Bloque creado');
      }

      setModalOpen(false);
      fetchAll();
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (b: RecurringBlock) => {
    try {
      const res = await fetch(`/api/business/recurring-blocks/${b.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !b.isActive }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error ?? 'Error');
        return;
      }
      toast.success(b.isActive ? 'Bloque desactivado' : 'Bloque activado');
      fetchAll();
    } catch {
      toast.error('Error');
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      const res = await fetch(`/api/business/recurring-blocks/${deleting.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        toast.error('Error al borrar');
        return;
      }
      toast.success('Bloque eliminado');
      setDeleting(null);
      fetchAll();
    } catch {
      toast.error('Error al borrar');
    }
  };

  const serviceName = (id: string | null) =>
    id === null
      ? 'Todos los servicios'
      : services.find((s) => s.id === id)?.name ?? 'Servicio eliminado';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarClock className="w-6 h-6" /> Horarios fijos
          </h1>
          <p className="text-sm text-gray-500">
            Bloqueá slots recurrentes (clientes fijos, mantenimiento, vacaciones).
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="rounded-full shadow-sm" onClick={fetchAll} disabled={loading}>
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Actualizar
          </Button>
          <Button className="rounded-full shadow-sm" onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" /> Agregar bloque
          </Button>
        </div>
      </div>

      {loading ? (
        <Card><CardContent className="p-12 text-center text-gray-400">Cargando…</CardContent></Card>
      ) : blocks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CalendarClock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No tenés bloques recurrentes todavía.</p>
            <Button className="rounded-full shadow-sm" onClick={openNew}>
              <Plus className="w-4 h-4 mr-2" /> Crear el primero
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {DAY_NAMES.map((name, day) => {
            const items = grouped[day];
            if (items.length === 0) return null;
            return (
              <Card key={day}>
                <CardContent className="p-4">
                  <div className="text-sm font-semibold text-gray-700 mb-3">{name}</div>
                  <ul className="space-y-2">
                    {items.map((b) => (
                      <li
                        key={b.id}
                        className={cn(
                          'flex items-center justify-between gap-3 p-3 rounded-xl border',
                          b.isActive ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">
                            {b.startTime} – {b.endTime}
                            <span className="text-gray-400 mx-2">·</span>
                            <span className="text-gray-700">{serviceName(b.serviceId)}</span>
                            {b.label && (
                              <>
                                <span className="text-gray-400 mx-2">·</span>
                                <span className="text-gray-600 italic">{b.label}</span>
                              </>
                            )}
                          </div>
                          {(b.startDate || b.endDate) && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              Validez: {b.startDate ?? '∞'} → {b.endDate ?? '∞'}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => toggleActive(b)}
                            className="p-2 rounded-lg hover:bg-gray-100"
                            title={b.isActive ? 'Desactivar' : 'Activar'}
                          >
                            {b.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => openEdit(b)}
                            className="p-2 rounded-lg hover:bg-gray-100"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleting(b)}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                            title="Borrar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal crear / editar */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? 'Editar bloque' : 'Nuevo bloque recurrente'}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-600 block mb-1">Día de la semana</label>
            <select
              value={form.dayOfWeek}
              onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })}
              className="w-full rounded-xl border border-gray-300 shadow-sm px-3 py-2 text-sm"
            >
              {DAY_NAMES.map((n, i) => (
                <option key={i} value={i}>{n}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-600 block mb-1">Servicio</label>
            <select
              value={form.serviceId}
              onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
              className="w-full rounded-xl border border-gray-300 shadow-sm px-3 py-2 text-sm"
            >
              <option value="">Todos los servicios</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 block mb-1">Hora desde</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full rounded-xl border border-gray-300 shadow-sm px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Hora hasta</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full rounded-xl border border-gray-300 shadow-sm px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <Input
              label="Etiqueta (opcional)"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target?.value ?? '' })}
              placeholder="Ej: Cliente fijo: Juan y amigos"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 block mb-1">Vigencia desde (opcional)</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full rounded-xl border border-gray-300 shadow-sm px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Vigencia hasta (opcional)</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full rounded-xl border border-gray-300 shadow-sm px-3 py-2 text-sm"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Dejá las fechas de vigencia vacías para un bloque permanente.
          </p>

<div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
  <Button
    variant="secondary"
    onClick={() => setModalOpen(false)}
    className="rounded-xl px-4 py-2 text-sm border border-gray-300 hover:bg-gray-100 transition"
  >
    Cancelar
  </Button>

  <Button
    onClick={submit}
    loading={saving}
    className="rounded-xl px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white shadow-sm transition"
  >
    {form.id ? 'Guardar cambios' : 'Crear bloque'}
  </Button>
</div>
        </div>
      </Modal>

      {/* Confirm borrado */}
      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Borrar bloque">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              ¿Eliminar el bloque {deleting && `${DAY_NAMES[deleting.dayOfWeek]} ${deleting.startTime}–${deleting.endTime}`}?
              <br />
              Los slots quedarán disponibles para nuevos clientes inmediatamente.
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button className="rounded-xl shadow-sm"variant="secondary" onClick={() => setDeleting(null)}>Cancelar</Button>
            <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 rounded-xl shadow-sm">
              Sí, borrar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
