import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Términos y Condiciones — BookingSaaS',
  description: 'Términos y Condiciones de uso de BookingSaaS.',
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-app-gradient">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">BookingSaaS</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Volver
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 sm:p-12 border border-gray-100">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Términos y Condiciones
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Última actualización: 27 de abril de 2026
          </p>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <p>
                Estos Términos y Condiciones (en adelante, &quot;los
                Términos&quot;) regulan el uso de la plataforma BookingSaaS (en
                adelante, &quot;la Plataforma&quot;), provista por{' '}
                <strong>[Nombre del titular / Razón social]</strong>, con domicilio
                en [Ciudad, Provincia, Argentina]. Al crear una cuenta o usar la
                Plataforma, aceptás estos Términos en su totalidad.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                1. Descripción del servicio
              </h2>
              <p>
                BookingSaaS es un sistema de reservas online para negocios
                (canchas de fútbol amateur, barberías, pádel, peluquerías y rubros
                similares). La Plataforma permite a los titulares de un negocio
                publicar un link público, configurar servicios y horarios, y
                recibir reservas de sus clientes finales.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                2. Cuenta de usuario
              </h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Para usar la Plataforma debés crear una cuenta con datos veraces
                  y mantenerlos actualizados.
                </li>
                <li>
                  Sos responsable de la confidencialidad de tu contraseña y de
                  toda actividad que ocurra bajo tu cuenta.
                </li>
                <li>
                  Debés tener al menos 18 años y representar legalmente al negocio
                  registrado.
                </li>
                <li>
                  Notificanos de inmediato si sospechás un uso no autorizado de tu
                  cuenta.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                3. Uso permitido y prohibido
              </h2>
              <p className="mb-3">Te comprometés a no usar la Plataforma para:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Actividades ilegales, fraudulentas o engañosas.</li>
                <li>
                  Cargar contenido ofensivo, discriminatorio o que vulnere
                  derechos de terceros.
                </li>
                <li>
                  Interferir con el funcionamiento de la Plataforma, intentar
                  accesos no autorizados o realizar ingeniería inversa.
                </li>
                <li>
                  Enviar spam o usar los datos de los clientes finales para fines
                  distintos a la operación de tu negocio.
                </li>
              </ul>
              <p className="mt-3">
                Como titular del negocio, sos el único responsable del tratamiento
                de los datos de tus clientes finales y debés cumplir con la Ley
                25.326 al utilizarlos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                4. Disponibilidad del servicio
              </h2>
              <p>
                Trabajamos para mantener la Plataforma disponible las 24 horas,
                pero no garantizamos un nivel de servicio (SLA) específico durante
                la etapa MVP. Pueden producirse interrupciones por mantenimiento,
                fallas de los proveedores de infraestructura o caso fortuito.
                Avisaremos las interrupciones programadas con la mayor antelación
                posible.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                5. Prueba gratuita y pagos
              </h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  La Plataforma ofrece una prueba gratuita de 7 días desde el alta
                  de la cuenta.
                </li>
                <li>
                  Vencida la prueba, el uso continuado del servicio puede requerir
                  el pago de un plan según las condiciones vigentes al momento de
                  la contratación.
                </li>
                <li>
                  Los precios y modalidades de pago serán informados con
                  anticipación dentro de la Plataforma. Las modificaciones de
                  precio se notificarán por email con al menos 30 días de
                  antelación.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                6. Cancelación y baja
              </h2>
              <p>
                Podés dar de baja tu cuenta en cualquier momento desde el panel de
                configuración o escribiendo a{' '}
                <a
                  href="mailto:g.a.gomez2016@gmail.com"
                  className="text-violet-600 hover:underline"
                >
                  g.a.gomez2016@gmail.com
                </a>
                . Nos reservamos el derecho de suspender o cancelar cuentas que
                violen estos Términos, previa notificación cuando sea posible.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                7. Propiedad intelectual
              </h2>
              <p>
                Todos los derechos sobre el software, el diseño y los contenidos
                de la Plataforma pertenecen a su titular. Te otorgamos una licencia
                limitada, no exclusiva e intransferible para usar la Plataforma
                conforme a estos Términos. Los datos que vos cargás siguen siendo
                de tu propiedad.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                8. Limitación de responsabilidad
              </h2>
              <p>
                En la medida máxima permitida por la ley, la Plataforma se ofrece
                &quot;tal como está&quot;. No nos responsabilizamos por:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>
                  Pérdidas indirectas, lucro cesante o daños emergentes derivados
                  del uso o de la imposibilidad de uso del servicio.
                </li>
                <li>
                  El comportamiento de los clientes finales que reservan a través
                  de tu link público.
                </li>
                <li>
                  Caídas o errores ocasionados por proveedores de infraestructura
                  externos.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                9. Modificaciones de los Términos
              </h2>
              <p>
                Podemos actualizar estos Términos. La versión vigente es la
                publicada en esta página. Cuando los cambios sean sustanciales, te
                avisaremos por email. El uso de la Plataforma luego de la entrada
                en vigencia de los nuevos Términos implica su aceptación.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                10. Ley aplicable y jurisdicción
              </h2>
              <p>
                Estos Términos se rigen por las leyes de la República Argentina.
                Cualquier controversia se someterá a la jurisdicción de los
                tribunales ordinarios de [Ciudad — completar], renunciando las
                partes a cualquier otro fuero o jurisdicción.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">11. Contacto</h2>
              <p>
                Para cualquier consulta sobre estos Términos podés escribirnos a{' '}
                <a
                  href="mailto:g.a.gomez2016@gmail.com"
                  className="text-violet-600 hover:underline"
                >
                  g.a.gomez2016@gmail.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <Link href="/privacidad" className="hover:text-gray-700">
            Política de Privacidad
          </Link>
        </div>
      </main>
    </div>
  );
}
