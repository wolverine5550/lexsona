'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  BookOpenIcon,
  MicrophoneIcon,
  InboxIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { NotificationsPanel } from './NotificationsPanel';

interface NavItem {
  name: string;
  href: string;
  icon: typeof HomeIcon;
}

const navigation: NavItem[] = [
  { name: 'Overview', href: '/dashboard', icon: HomeIcon },
  { name: 'My Books', href: '/dashboard/books', icon: BookOpenIcon },
  { name: 'Podcasts', href: '/dashboard/podcasts', icon: MicrophoneIcon },
  { name: 'Messages', href: '/dashboard/messages', icon: InboxIcon },
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon }
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          sidebarOpen ? 'block' : 'hidden'
        }`}
      >
        <div className="fixed inset-0 bg-zinc-900/80" />
        <div className="fixed inset-y-0 left-0 w-64 bg-zinc-900">
          <div className="flex h-16 items-center justify-between px-6">
            <span className="text-xl font-semibold text-white">Lexsona</span>
            <button
              type="button"
              className="text-zinc-400 hover:text-zinc-200"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close mobile menu"
            >
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <nav className="px-4 py-4" aria-label="Mobile navigation">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium ${
                  pathname === item.href
                    ? 'bg-blue-500/10 text-blue-500'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64">
        <div className="flex flex-1 flex-col bg-zinc-900">
          <div className="flex h-16 items-center px-6">
            <span className="text-xl font-semibold text-white">Lexsona</span>
          </div>
          <nav className="flex-1 px-4 py-4" aria-label="Desktop navigation">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium ${
                  pathname === item.href
                    ? 'bg-blue-500/10 text-blue-500'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 bg-zinc-900 px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="text-zinc-400 hover:text-zinc-200 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Toggle mobile menu"
            >
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
            <NotificationsPanel />
          </div>
        </div>
        <main className="px-4 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
