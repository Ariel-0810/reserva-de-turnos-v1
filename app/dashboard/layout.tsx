import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { DashboardNav } from './_components/dashboard-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  if ((session.user as any)?.role === 'SUPERADMIN') {
    redirect('/admin');
  }

  // ✅ VERIFICAR SI EL NEGOCIO ESTÁ ACTIVO
  if ((session.user as any)?.role === 'BUSINESS_OWNER') {
    const businessIsActive = (session.user as any)?.businessIsActive;
    
    if (businessIsActive === false) {
      redirect('/negocio-desactivado');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav user={session.user as any} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
