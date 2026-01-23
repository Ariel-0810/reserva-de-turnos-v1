'use client';

import { useState, useEffect, useRef } from 'react';
import { Settings, Copy, Check, Clock, Building, Save, MessageCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { Modal } from '@/components/ui/modal';
import { TimeInput } from '@/components/ui/time-input';
import { DAY_NAMES } from '@/lib/types';
import toast from 'react-hot-toast';

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
    whatsappNumber: '',
    ownerName: '',
    ownerPhone: '',
  });

  const [hours, setHours] = useState<{ dayOfWeek: number; isOpen: boolean; openTime: string; closeTime: string }[]>([]);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);

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
          whatsappNumber: data?.whatsappNumber ?? '',
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
                label="Nombre del negocio"
                value={formData?.name ?? ''}
                onChange={(e) => setFormData({ ...formData, name: e.target?.value ?? '' })}
                required
              />
              <Input
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
                <code className="flex-1 bg-white px-3 py-2 rounded-lg text-sm text-gray-700 border border-violet-200 truncate">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/booking/{formData?.slug}
                </code>
                <Button type="button" variant="outline" size="sm" onClick={copyLink}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Nombre del dueño"
                value={formData?.ownerName ?? ''}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target?.value ?? '' })}
              />
              <Input
                label="Teléfono del dueño"
                value={formData?.ownerPhone ?? ''}
                onChange={(e) => setFormData({ ...formData, ownerPhone: e.target?.value ?? '' })}
              />
            </div>

            <Input
              label="Teléfono del negocio"
              value={formData?.phone ?? ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target?.value ?? '' })}
            />

            <Input
              label="Dirección"
              value={formData?.address ?? ''}
              onChange={(e) => setFormData({ ...formData, address: e.target?.value ?? '' })}
            />

            <Textarea
              label="Descripción"
              value={formData?.description ?? ''}
              onChange={(e) => setFormData({ ...formData, description: e.target?.value ?? '' })}
              rows={3}
            />

            <Button type="submit" loading={saving}>
              <Save className="w-4 h-4 mr-2" /> Guardar cambios
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* WhatsApp Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" /> WhatsApp para Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-green-50 rounded-xl p-4 text-sm text-green-800">
              <p className="font-medium mb-2">📱 ¿Cómo funciona?</p>
              <p className="text-green-700">
                Al confirmar o cancelar una reserva, se abrirá WhatsApp en tu teléfono con un mensaje listo para enviar al cliente.
                Esto te permite notificar a tus clientes directamente desde tu número personal o de negocio.
              </p>
            </div>
            
            <Input
              label="Tu número de WhatsApp (con código de país)"
              placeholder="Ej: 5491112345678"
              value={formData?.whatsappNumber ?? ''}
              onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target?.value?.replace(/[^0-9+]/g, '') ?? '' })}
              icon={<MessageCircle className="w-5 h-5" />}
            />
            <p className="text-xs text-gray-500 -mt-2">
              Ingresa el número sin espacios ni guiones. Ej: Argentina +54 9 11 1234-5678 → 5491112345678
            </p>

            <Button onClick={handleSaveBusiness} loading={saving}>
              <Save className="w-4 h-4 mr-2" /> Guardar número de WhatsApp
            </Button>
          </div>
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
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-gray-50 rounded-xl"
                >
                  <div className="w-24 shrink-0">
                    <span className="font-medium text-gray-900">{DAY_NAMES[dayOfWeek]}</span>
                  </div>
                  <Toggle
                    checked={dayHours?.isOpen ?? false}
                    onChange={(checked) => updateHour(dayOfWeek, 'isOpen', checked)}
                  />
                  {dayHours?.isOpen && (
                    <div className="flex items-center gap-2 flex-1">
                      <TimeInput
                        value={dayHours?.openTime ?? '09:00'}
                        onChange={(value) => updateHour(dayOfWeek, 'openTime', value)}
                        className="w-32"
                      />
                      <span className="text-gray-500">a</span>
                      <TimeInput
                        value={dayHours?.closeTime ?? '23:00'}
                        onChange={(value) => updateHour(dayOfWeek, 'closeTime', value)}
                        className="w-32"
                      />
                    </div>
                  )}
                  {!dayHours?.isOpen && (
                    <span className="text-sm text-gray-500">Cerrado</span>
                  )}
                </div>
              );
            })}
          </div>

          <Button onClick={handleSaveHours} className="mt-6" loading={savingHours}>
            <Save className="w-4 h-4 mr-2" /> Guardar horarios
          </Button>
        </CardContent>
      </Card>

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
