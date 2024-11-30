'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

// Navigation items for settings
const settingsNavItems = [
  {
    label: 'Profile',
    href: '/settings/profile',
    description: 'Your public profile information'
  },
  {
    label: 'Account',
    href: '/settings/account',
    description: 'Manage your account settings'
  },
  {
    label: 'Notifications',
    href: '/settings/notifications',
    description: 'Configure notification preferences'
  },
  {
    label: 'Privacy',
    href: '/settings/privacy',
    description: 'Control your privacy settings'
  },
  {
    label: 'Email',
    href: '/settings/email',
    description: 'Email and communication preferences'
  },
  {
    label: 'Integrations',
    href: '/settings/integrations',
    description: 'Manage API keys and integrations'
  }
];

export default function SettingsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Settings Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Navigation Sidebar */}
          <nav className="col-span-12 lg:col-span-3 space-y-1">
            {settingsNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    block px-4 py-2 rounded-md text-sm
                    ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="font-medium">{item.label}</span>
                  <p
                    className={`mt-0.5 ${
                      isActive ? 'text-blue-500' : 'text-gray-500'
                    }`}
                  >
                    {item.description}
                  </p>
                </Link>
              );
            })}
          </nav>

          {/* Main Content Area */}
          <main className="col-span-12 lg:col-span-9">
            <div className="bg-white shadow rounded-lg">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
