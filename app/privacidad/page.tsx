import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Política de Privacidad — AgendUp',
  description: 'Política de Privacidad de AgendUp adaptada a la Ley 25.326 de Protección de Datos Personales (Argentina).',
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-app-gradient">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">AgendUp</span>
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
            Política de Privacidad
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Última actualización: 27 de abril de 2026
          </p>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <p>
                Esta Política de Privacidad describe cómo AgendUp (en adelante,
                &quot;la Plataforma&quot;) recolecta, utiliza y protege la
                información personal de sus usuarios, en cumplimiento con la
                <strong> Ley 25.326 de Protección de los Datos Personales</strong>{' '}
                de la República Argentina y las normas concordantes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                1. Responsable del tratamiento
              </h2>
              <p>
                El responsable del tratamiento de los datos personales es{' '}
                <strong>AgendUp</strong>, con domicilio
                en Buenos Aires, Argentina. Para cualquier consulta vinculada
                a esta política, podés escribirnos a{' '}
                <a
                  href="mailto:soporteagendup@gmail.com"
                  className="text-violet-600 hover:underline"
                >
                  soporteagendup@gmail.com
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                2. Datos que recolectamos
              </h2>
              <p className="mb-3">
                Recolectamos únicamente los datos necesarios para operar el
                servicio:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>Datos del titular del negocio:</strong> nombre, email,
                  teléfono / WhatsApp, nombre del negocio, contraseña (almacenada
                  en forma cifrada).
                </li>
                <li>
                  <strong>Datos de configuración:</strong> servicios ofrecidos,
                  horarios de atención, dirección y datos de contacto del negocio.
                </li>
                <li>
                  <strong>Datos de clientes finales (reservas):</strong> nombre,
                  email y teléfono que el cliente final ingresa al hacer una
                  reserva en el link público del negocio.
                </li>
                <li>
                  <strong>Datos técnicos:</strong> dirección IP, tipo de navegador
                  y registros de actividad necesarios para auditoría y seguridad.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                3. Finalidades del tratamiento
              </h2>
              <p className="mb-3">Los datos se utilizan exclusivamente para:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Crear y autenticar tu cuenta en la Plataforma.</li>
                <li>
                  Permitir que tus clientes hagan reservas a través de tu link
                  público.
                </li>
                <li>
                  Enviar notificaciones operativas por email (confirmaciones,
                  recordatorios, recuperación de contraseña, verificación de
                  cuenta).
                </li>
                <li>Operar y mejorar el servicio, y prevenir abusos.</li>
              </ul>
              <p className="mt-3">
                <strong>No utilizamos los datos para fines publicitarios</strong> ni
                los compartimos con terceros con fines comerciales.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                4. Terceros que prestan servicios técnicos
              </h2>
              <p className="mb-3">
                Para operar la Plataforma utilizamos proveedores de infraestructura
                que procesan datos en nuestro nombre, exclusivamente para los
                fines descritos arriba:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>Vercel Inc.</strong> — hosting y entrega del sitio web.
                </li>
                <li>
                  <strong>Neon</strong> — base de datos PostgreSQL en la nube.
                </li>
                <li>
                  <strong>Resend</strong> — envío de emails transaccionales.
                </li>
                <li>
                  <strong>Google</strong> — únicamente si el usuario opta por
                  iniciar sesión con su cuenta de Google.
                </li>
              </ul>
              <p className="mt-3">
                Estos proveedores pueden almacenar datos fuera de Argentina; en
                todos los casos contamos con sus correspondientes términos y
                garantías de seguridad.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                5. Derechos del titular de los datos
              </h2>
              <p className="mb-3">
                De acuerdo con los artículos 14, 15 y 16 de la Ley 25.326, podés
                ejercer los siguientes derechos en cualquier momento:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>Acceso:</strong> solicitar una copia de los datos que
                  tenemos sobre vos.
                </li>
                <li>
                  <strong>Rectificación:</strong> corregir datos inexactos o
                  desactualizados.
                </li>
                <li>
                  <strong>Supresión:</strong> pedir que eliminemos tus datos cuando
                  ya no sean necesarios.
                </li>
                <li>
                  <strong>Oposición:</strong> oponerte al tratamiento en los casos
                  previstos por la ley.
                </li>
              </ul>
              <p className="mt-3">
                Para ejercerlos, escribinos a{' '}
                <a
                  href="mailto:soporteagendup@gmail.com"
                  className="text-violet-600 hover:underline"
                >
                  soporteagendup@gmail.com
                </a>{' '}
                desde el email registrado en tu cuenta. Te responderemos dentro de
                los 10 días hábiles que establece la ley.
              </p>
              <p className="mt-3 text-sm text-gray-600">
                La <strong>Agencia de Acceso a la Información Pública</strong>, en
                su carácter de Órgano de Control de la Ley 25.326, tiene la
                atribución de atender denuncias y reclamos relacionados con la
                protección de datos personales (
                <a
                  href="https://www.argentina.gob.ar/aaip"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-600 hover:underline"
                >
                  www.argentina.gob.ar/aaip
                </a>
                ).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                6. Conservación y seguridad
              </h2>
              <p>
                Conservamos los datos mientras tu cuenta esté activa y por el
                plazo adicional que requieran obligaciones legales o contables.
                Aplicamos medidas técnicas y organizativas razonables para proteger
                los datos contra accesos no autorizados, pérdida o alteración:
                cifrado de contraseñas, conexiones HTTPS, control de accesos y
                copias de seguridad.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                7. Datos de menores de edad
              </h2>
              <p>
                La Plataforma está dirigida a personas mayores de 18 años. No
                recolectamos intencionalmente datos de menores. Si detectás que un
                menor cargó datos en la Plataforma, escribinos y los eliminaremos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                8. Modificaciones de esta política
              </h2>
              <p>
                Podemos actualizar esta política para reflejar cambios legales o
                del servicio. La versión vigente es siempre la publicada en esta
                página. Cuando los cambios sean sustanciales, te avisaremos por
                email.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">9. Contacto</h2>
              <p>
                Para cualquier consulta sobre esta Política de Privacidad o el
                tratamiento de tus datos, podés escribirnos a{' '}
                <a
                  href="mailto:soporteagendup@gmail.com"
                  className="text-violet-600 hover:underline"
                >
                  soporteagendup@gmail.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <Link href="/terminos" className="hover:text-gray-700">
            Términos y Condiciones
          </Link>
        </div>
      </main>
    </div>
  );
}
