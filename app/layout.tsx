import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';

// ✅ Removido force-dynamic para permitir optimizaciones por página
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // ✅ Mejora performance de carga de fuentes
});

export const metadata: Metadata = {
  title: 'BookingSaaS - Sistema de Reservas para Negocios',
  description: 'Plataforma completa para gestionar reservas y turnos de tu negocio',
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'BookingSaaS - Sistema de Reservas',
    description: 'Plataforma completa para gestionar reservas y turnos de tu negocio',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* ✅ Preconnect para mejorar carga de recursos externos */}
        <link rel="preconnect" href="https://apps.abacus.ai" />
        <link rel="dns-prefetch" href="https://apps.abacus.ai" />
        
        {/* ✅ Script cargado de forma async/defer para no bloquear */}
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js" async defer />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
