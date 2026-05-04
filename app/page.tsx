import Link from 'next/link';
import { Calendar, Users, Clock, Shield, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { SystemConfig } from '@/lib/db';

// ISR: la landing se regenera cada 60s con el precio actual de SystemConfig.
// Trade-off: pierde Static Generation pura, pero queda detrás de cache de Vercel
// y refleja cambios de precio sin redeploy.
export const revalidate = 60;

const FALLBACK_PRICE = 20000;

async function getMonthlyPrice(): Promise<number> {
  try {
    const cfg = await SystemConfig.findOne({ where: { key: 'plan.defaultPrice' } });
    const v = cfg?.value;
    if (v) {
      const parsed = parseFloat(v);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {
    // si la DB falla en build, fallback al hardcoded
  }
  return FALLBACK_PRICE;
}

function fmtPrice(n: number): string {
  return n.toLocaleString('es-AR');
}

export default async function HomePage() {
  const monthlyPrice = await getMonthlyPrice();
  const priceLabel = `$${fmtPrice(monthlyPrice)}`;

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

  const planFeatures = [
    'Reservas ilimitadas',
    'Recordatorios por email',
    'Link público propio',
    'Horarios fijos / clientes frecuentes',
    'Calendario diario / semanal / mensual',
    'Soporte por WhatsApp',
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
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/#pricing"
                className="hidden sm:inline-flex px-4 py-2.5 text-sm font-semibold text-gray-700 hover:text-violet-700 transition"
              >
                Precios
              </Link>
              <Link
                href="/login"
                className="px-4 sm:px-5 py-2.5 text-sm font-semibold text-violet-700 bg-gradient-to-r from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 rounded-xl transition-all duration-200 border border-violet-200 hover:border-violet-300 shadow-sm hover:shadow-md backdrop-blur-sm"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/signup"
                className="px-4 sm:px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
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
            <p className="text-lg sm:text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
              Ideal para canchas de fútbol, pádel, barberías y peluquerías.
            </p>
            <p className="text-sm text-violet-700 font-medium mb-10">
              ⚡ 7 días gratis · Sin tarjeta de crédito
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-all shadow-lg hover:shadow-xl"
              >
                Empezar 7 días gratis <ArrowRight className="w-5 h-5" />
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

      {/* PRICING */}
      <section id="pricing" className="py-16 px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-3">
            Un solo plan, todo incluido
          </h2>
          <p className="text-center text-gray-600 mb-10">
            Sin sorpresas. Sin tiers. Sin letra chica.
          </p>

          <div className="bg-white rounded-3xl shadow-2xl border-2 border-violet-200 overflow-hidden">
            <div className="bg-gradient-to-br from-violet-600 to-purple-600 text-white p-8 text-center">
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                7 días gratis · Sin tarjeta
              </div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl sm:text-6xl font-bold">{priceLabel}</span>
                <span className="text-lg text-violet-100">ARS / mes</span>
              </div>
              <p className="text-violet-100 text-sm mt-3">
                Después del trial. Cancelás cuando quieras desde tu dashboard.
              </p>
            </div>

            <div className="p-8">
              <ul className="space-y-3 mb-8">
                {planFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 text-base font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                Empezar 7 días gratis <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-xs text-gray-500 text-center mt-3">
                No te pedimos tarjeta para el trial. Si no te convence, no pagás nada.
              </p>
            </div>
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
            7 días gratis. Sin tarjeta de crédito. Cancelás cuando quieras.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-violet-700 bg-white rounded-xl hover:bg-violet-50 transition-all shadow-lg"
          >
            <CheckCircle className="w-5 h-5" /> Empezar 7 días gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-200 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">BookingSaaS</span>
            </div>

            <div className="flex items-center gap-2 bg-gradient-to-r from-violet-50 to-purple-50 px-4 py-2 rounded-xl border border-violet-200">
              <span className="text-sm text-gray-600">Hecho por</span>
              <span className="text-sm font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                El Tanke Dev
              </span>
                👨‍💻
            </div>

            <p className="text-sm text-gray-500 text-center sm:text-right">
              © 2026 Todos los derechos reservados.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
            <Link href="/privacidad" className="hover:text-gray-700">Política de Privacidad</Link>
            <span>·</span>
            <Link href="/terminos" className="hover:text-gray-700">Términos y Condiciones</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
