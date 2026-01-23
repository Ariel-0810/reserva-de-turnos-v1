'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  Shield,
  Building2,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminNavProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

const navItems = [
  { href: '/admin', label: 'Estadísticas', icon: BarChart3 },
  { href: '/admin/businesses', label: 'Negocios', icon: Building2 },
  { href: '/admin/bookings', label: 'Reservas', icon: ClipboardList },
  { href: '/admin/integrations', label: 'Integraciones', icon: Settings },
];

export function AdminNav({ user }: AdminNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin' || pathname === '/admin/stats';
    return pathname?.startsWith(href);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold hidden sm:block">Admin Panel</span>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item?.href}
                  href={item?.href ?? '#'}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    isActive(item?.href ?? '')
                      ? 'bg-white/10 text-white'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item?.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium truncate max-w-[150px]">
                  {user?.name ?? 'Admin'}
                </p>
                <p className="text-xs text-gray-400 truncate max-w-[150px]">{user?.email ?? ''}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 text-gray-300 hover:bg-white/5 rounded-lg"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-slate-900">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item?.href}
                href={item?.href ?? '#'}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all',
                  isActive(item?.href ?? '')
                    ? 'bg-white/10 text-white'
                    : 'text-gray-300 hover:bg-white/5'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item?.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
