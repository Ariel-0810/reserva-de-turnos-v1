import Link from 'next/link';
import { Calendar, Users, Clock, Shield, ArrowRight, CheckCircle } from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: Calendar,
      title: 'Gestión de Reservas',
      description: 'Visualiza y administra todas tus reservas desde un panel centralizado.',
    },
    {
      icon: Users,
      title: 'Link Público',
      description: 'Comparte un link único para que tus clientes reserven sin necesidad de registrarse.',
    },
    {
      icon: Clock,
      title: 'Horarios Flexibles',
      description: 'Configura los horarios de apertura y cierre para cada día de la semana.',
    },
    {
      icon: Shield,
      title: 'Notificaciones',
      description: 'Recibe alertas por email cuando tengas nuevas reservas pendientes.',
    },
  ];

  return (
    <div className="min-h-screen bg-app-gradient">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">BookingSaaS</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-5 py-2.5 text-sm font-semibold text-violet-700 bg-gradient-to-r from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 rounded-xl transition-all duration-200 border border-violet-200 hover:border-violet-300 shadow-sm hover:shadow-md backdrop-blur-sm"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 sm:p-12 shadow-xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Gestiona las reservas de tu negocio de forma <span className="text-violet-600">simple</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Ideal para canchas de fútbol, peluquerías, consultorios y cualquier negocio que trabaje con turnos.
            </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-all shadow-lg hover:shadow-xl"
            >
              Comenzar gratis <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-gray-700 bg-white rounded-xl hover:bg-gray-50 transition-all shadow-md border border-gray-200"
            >
              Ya tengo cuenta
            </Link>
          </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto bg-white/90 backdrop-blur-sm rounded-3xl p-8 sm:p-12 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-12">
            Todo lo que necesitas para gestionar tus turnos
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-violet-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature?.title}</h3>
                <p className="text-gray-600 text-sm">{feature?.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-12">
            Cómo funciona
          </h2>
          <div className="space-y-6">
            {[
              { step: '1', title: 'Regístrate', desc: 'Crea tu cuenta y configura tu negocio en minutos.' },
              { step: '2', title: 'Configura servicios', desc: 'Agrega los servicios que ofreces con precios y duración.' },
              { step: '3', title: 'Comparte tu link', desc: 'Envía tu link único a tus clientes para que reserven.' },
              { step: '4', title: 'Gestiona reservas', desc: 'Confirma o cancela reservas desde tu dashboard.' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-4 bg-white p-5 rounded-xl shadow-sm">
                <div className="w-10 h-10 bg-violet-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">
                  {item?.step}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item?.title}</h3>
                  <p className="text-gray-600 text-sm">{item?.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-violet-600 to-violet-700 rounded-3xl p-10 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Comienza a recibir reservas hoy
          </h2>
          <p className="text-violet-100 mb-8">
            Sin tarjeta de crédito. Sin complicaciones.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-violet-700 bg-white rounded-xl hover:bg-violet-50 transition-all shadow-lg"
          >
            <CheckCircle className="w-5 h-5" /> Crear mi cuenta gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-200 bg-white/50">
        <div className="max-w-6xl mx-auto">
          {/* Single row layout - responsive */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Logo y nombre */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">BookingSaaS</span>
            </div>

            {/* Centro - Hecho por El Tanke Dev (más destacado) */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-violet-50 to-purple-50 px-4 py-2 rounded-xl border border-violet-200">
              <span className="text-sm text-gray-600">Hecho por</span>
              <span className="text-sm font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                El Tanke Dev 
              </span>
                👨‍💻
            </div>

            {/* Copyright */}
            <p className="text-sm text-gray-500 text-center sm:text-right">
              © 2026 Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
