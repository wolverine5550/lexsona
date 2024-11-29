'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Podcasts', path: '/dashboard/podcasts' }
  ];

  return (
    <div>
      <nav>
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              data-active={isActive}
              className={`block px-4 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
