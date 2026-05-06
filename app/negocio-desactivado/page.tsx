'use client';

import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Mail, LogOut, ArrowLeft } from 'lucide-react';

export default function NegocioDesactivadoPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated';

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-red-200">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 p-4 rounded-full">
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-3">
            Negocio Desactivado
          </h1>

          {/* Message */}
          <p className="text-gray-600 text-center mb-6">
            Tu negocio ha sido temporalmente desactivado y no puede recibir nuevas reservas en este momento.
          </p>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              Contacta al Administrador
            </h3>
            <p className="text-sm text-blue-800 mb-2">
              Para reactivar tu negocio o consultar el motivo de la desactivación, por favor contacta a:
            </p>
            <a
              href="mailto:soporteagendup@gmail.com"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 underline"
            >
              soporteagendup@gmail.com
            </a>
          </div>

          {/* Reasons */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">
              Motivos comunes de desactivación:
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Violación de términos de servicio</li>
              <li>• Falta de pago de suscripción</li>
              <li>• Mantenimiento programado</li>
              <li>• Verificación pendiente de documentos</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {/* Contact Button */}
            <a
              href="mailto:soporteagendup@gmail.com?subject=Consulta sobre desactivación de mi negocio&body=Hola, mi negocio fue desactivado y me gustaría conocer el motivo y cómo reactivarlo."
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <Mail className="w-4 h-4 mr-2" />
              Enviar Email al Administrador
            </a>

            {/* Logout/Back Button */}
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </button>
            ) : (
              <button
                onClick={handleBackToLogin}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Login
              </button>
            )}
          </div>

          {/* Footer Note */}
          <p className="text-xs text-gray-500 text-center mt-6">
            Una vez reactivado tu negocio, podrás acceder nuevamente a tu dashboard y recibir reservas.
          </p>
        </div>

        {/* Extra Info */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            ¿Necesitas ayuda inmediata?
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Respuesta típica: 24-48 horas hábiles
          </p>
        </div>
      </div>
    </div>
  );
}
