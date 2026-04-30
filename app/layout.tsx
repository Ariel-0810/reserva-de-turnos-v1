import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BookingSaaS — Reservas online para canchas, barberías y pádel',
  description: 'Sistema de reservas online para canchas de fútbol, barberías, pádel y más. Link público para tus clientes, panel de gestión y notificaciones automáticas. Probalo gratis 7 días.',
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'BookingSaaS — Reservas online para tu negocio',
    description: 'Reservas online para canchas amateurs, barberías y pádel. Link público, panel de gestión y notificaciones automáticas.',
    images: ['/og-image.png'],
    type: 'website',
    locale: 'es_AR',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
