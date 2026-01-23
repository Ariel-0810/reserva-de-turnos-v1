'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, MessageCircle, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

export function IntegrationsClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioWhatsappNumber: '',
  });

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const res = await fetch('/api/admin/integrations');
      const data = await res.json();
      setFormData({
        twilioAccountSid: data?.twilioAccountSid ?? '',
        twilioAuthToken: data?.twilioAuthToken ?? '',
        twilioWhatsappNumber: data?.twilioWhatsappNumber ?? '',
      });
    } catch {
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/admin/integrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error();
      toast.success('Configuración guardada');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
          <Settings className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integraciones</h1>
          <p className="text-sm text-gray-500">Configura servicios externos</p>
        </div>
      </div>

      {/* Twilio / WhatsApp */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" /> Twilio WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Próximamente</p>
              <p className="text-sm text-amber-700">
                Las notificaciones de WhatsApp estarán disponibles en una próxima actualización.
                Puedes configurar las credenciales ahora para cuando esté habilitado.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Account SID"
              value={formData?.twilioAccountSid ?? ''}
              onChange={(e) =>
                setFormData({ ...formData, twilioAccountSid: e.target?.value ?? '' })
              }
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />

            <Input
              label="Auth Token"
              type="password"
              value={formData?.twilioAuthToken ?? ''}
              onChange={(e) =>
                setFormData({ ...formData, twilioAuthToken: e.target?.value ?? '' })
              }
              placeholder="••••••••••••••••"
            />

            <Input
              label="Número de WhatsApp"
              value={formData?.twilioWhatsappNumber ?? ''}
              onChange={(e) =>
                setFormData({ ...formData, twilioWhatsappNumber: e.target?.value ?? '' })
              }
              placeholder="+1234567890"
            />

            <Button type="submit" loading={saving}>
              <Save className="w-4 h-4 mr-2" /> Guardar configuración
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
