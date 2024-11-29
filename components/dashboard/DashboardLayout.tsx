'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Podcasts', path: '/dashboard/podcasts' },
    { name: 'Books', path: '/dashboard/books' },
    { name: 'Messages', path: '/dashboard/messages' },
    { name: 'Analytics', path: '/dashboard/analytics' },
    { name: 'Settings', path: '/dashboard/settings' }
  ];

  return (
    <div>
      <nav aria-label="Desktop Navigation">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            data-active={isActive(item.path).toString()}
            className={`
              block px-4 py-2 text-sm transition-colors
              ${
                isActive(item.path)
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white'
              }
            `}
          >
            {item.name}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
