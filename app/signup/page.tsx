'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, Mail, Lock, User, Phone, Building, ArrowLeft, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPhoneConfig, buildFullPhoneNumber } from '@/lib/phone-prefixes';
import toast from 'react-hot-toast';

type Step = 'register' | 'verify';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [step, setStep] = useState<Step>('register');
  const [verificationCode, setVerificationCode] = useState('');
  const [resending, setResending] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '', // Solo la parte local sin prefijo
    businessName: '',
  });

  // Argentina fijo - no se puede cambiar
  const phoneConfig = getPhoneConfig('AR');

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (error) {
      toast.error('Error al registrarse con Google');
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('📝 Iniciando registro...');
      
      // Construir teléfono completo con prefijo de Argentina para WhatsApp
      const fullPhone = formData.phone 
        ? buildFullPhoneNumber('AR', formData.phone)
        : '';
      
      console.log('📱 Teléfono completo para WhatsApp:', fullPhone);
      
      // 1. Create account
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          phone: fullPhone, // Enviar con formato +549...
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('❌ Error al crear cuenta:', data);
        toast.error(data?.error || 'Error al registrarse');
        setLoading(false);
        return;
      }

      console.log('✅ Cuenta creada exitosamente');

      // 2. Send verification code
      console.log('📧 Enviando código de verificación a:', formData.email);
      
      const sendCodeRes = await fetch('/api/auth/verify-email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      const sendCodeData = await sendCodeRes.json();

      if (sendCodeRes.ok) {
        console.log('✅ Código enviado exitosamente');
        toast.success('¡Cuenta creada! Te enviamos un código de verificación a tu email.');
        toast.success('Revisa tu bandeja de entrada y spam', { duration: 5000 });
        setStep('verify');
      } else {
        console.error('❌ Error al enviar código:', sendCodeData);
        toast.error(
          sendCodeData?.details 
            ? `Error al enviar email: ${sendCodeData.details}`
            : 'No pudimos enviar el email. Puedes verificarlo más tarde.'
        );
        
        // Show option to verify later
        toast(
          'Puedes acceder al dashboard y verificar tu email después',
          { duration: 6000, icon: '⚠️' }
        );
        
        setStep('verify'); // Still show verification form
      }
    } catch (error: any) {
      console.error('❌ Error inesperado:', error);
      toast.error('Error al registrarse: ' + (error?.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔍 Verificando código...');
      
      const res = await fetch('/api/auth/verify-email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: verificationCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('❌ Error al verificar:', data);
        toast.error(data?.error || 'Código inválido');
        setLoading(false);
        return;
      }

      console.log('✅ Email verificado correctamente');
      toast.success('¡Email verificado correctamente!');

      // Auto login
      console.log('🔐 Iniciando sesión...');
      const loginResult = await signIn('credentials', {
        email: formData?.email ?? '',
        password: formData?.password ?? '',
        redirect: false,
      });

      if (loginResult?.ok) {
        console.log('✅ Login exitoso, redirigiendo a dashboard');
        toast.success('¡Bienvenido! Redirigiendo...');
        router.push('/dashboard');
      } else {
        console.error('❌ Error en login automático:', loginResult?.error);
        toast.error('Por favor inicia sesión manualmente');
        router.push('/login');
      }
    } catch (error: any) {
      console.error('❌ Error al verificar:', error);
      toast.error('Error al verificar: ' + (error?.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    try {
      console.log('🔄 Reenviando código...');
      
      const res = await fetch('/api/auth/verify-email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await res.json();

      if (res.ok) {
        console.log('✅ Código reenviado');
        toast.success('Código reenviado a tu email');
        toast('Revisa tu bandeja de entrada y spam', { icon: '📬' });
      } else {
        console.error('❌ Error al reenviar:', data);
        toast.error(data?.details || 'Error al reenviar código');
      }
    } catch (error: any) {
      console.error('❌ Error al reenviar:', error);
      toast.error('Error al reenviar: ' + (error?.message || 'Error desconocido'));
    } finally {
      setResending(false);
    }
  };

  const handleSkipVerification = async () => {
    console.log('⏭️ Saltando verificación...');
    toast('Redirigiendo al login...', { icon: '⏭️' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-app-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {step === 'register' ? 'Crear Cuenta' : 'Verificar Email'}
            </h1>
          </div>

          {step === 'register' ? (
            <>
              {/* Google Sign Up - Hidden for now, can be enabled with NEXT_PUBLIC_ENABLE_GOOGLE_SSO=true */}
              {process.env.NEXT_PUBLIC_ENABLE_GOOGLE_SSO === 'true' && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mb-6 h-12 text-gray-700 border-gray-300 hover:bg-gray-50"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                  >
                    {googleLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Conectando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-3">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Registrarse con Google
                      </span>
                    )}
                  </Button>

                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">o regístrate con email</span>
                    </div>
                  </div>
                </>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Nombre completo"
                  type="text"
                  placeholder="Juan Pérez"
                  value={formData?.name ?? ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target?.value ?? '' })}
                  icon={<User className="w-5 h-5" />}
                  required
                />

                <Input
                  label="Email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData?.email ?? ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target?.value ?? '' })}
                  icon={<Mail className="w-5 h-5" />}
                  required
                />

                {/* Teléfono con bandera de Argentina */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono / WhatsApp (opcional)
                  </label>
                  <div className="relative flex items-center">
                    {/* Bandera y prefijo fijo de Argentina */}
                    <div className="absolute left-3 flex items-center gap-2 pointer-events-none">
                      <span className="text-2xl">{phoneConfig.flag}</span>
                      <span className="text-gray-600 font-medium">{phoneConfig.dialCode}</span>
                    </div>
                    
                    {/* Input para número local */}
                    <input
                      type="tel"
                      placeholder="11 1234 5678"
                      value={formData?.phone ?? ''}
                      onChange={(e) => {
                        // Solo números, formatear automáticamente
                        const numbers = e.target?.value?.replace(/\D/g, '') ?? '';
                        setFormData({ ...formData, phone: numbers });
                      }}
                      className="w-full pl-28 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Este número se usará para notificaciones de WhatsApp. Ingresa solo los números sin espacios.
                  </p>
                </div>

                <Input
                  label="Nombre del negocio"
                  type="text"
                  placeholder="Mi Peluquería"
                  value={formData?.businessName ?? ''}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target?.value ?? '' })}
                  icon={<Building className="w-5 h-5" />}
                  required
                />

                <Input
                  label="Contraseña"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={formData?.password ?? ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target?.value ?? '' })}
                  icon={<Lock className="w-5 h-5" />}
                  required
                  minLength={6}
                />

                <Button type="submit" className="w-full" size="lg" loading={loading}>
                  Crear Cuenta
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-violet-600" />
                </div>
                <p className="text-gray-600">
                  Enviamos un código de 6 dígitos a<br />
                  <span className="font-medium text-gray-900">{formData.email}</span>
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <Input
                  label="Código de verificación"
                  type="text"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target?.value?.replace(/\D/g, '').slice(0, 6) ?? '')}
                  icon={<KeyRound className="w-5 h-5" />}
                  required
                  maxLength={6}
                  className="text-center text-2xl tracking-[0.5em]"
                />

                <Button type="submit" className="w-full" size="lg" loading={loading}>
                  Verificar Email
                </Button>
              </form>

              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resending}
                  className="w-full text-sm text-violet-600 hover:text-violet-700 disabled:opacity-50"
                >
                  {resending ? 'Reenviando...' : '¿No recibiste el código? Reenviar'}
                </button>
                
                <button
                  type="button"
                  onClick={handleSkipVerification}
                  className="w-full text-sm text-gray-500 hover:text-gray-700"
                >
                  Verificar más tarde
                </button>
              </div>
            </>
          )}

          {step === 'register' && (
            <p className="mt-6 text-center text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-violet-600 hover:text-violet-700 font-medium">
                Inicia sesión
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
