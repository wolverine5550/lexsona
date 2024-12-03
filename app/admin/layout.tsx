'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import {
  Users,
  Settings,
  Shield,
  BarChart3,
  CreditCard,
  Menu,
  X,
  ChevronRight,
  LogOut,
  User
} from 'lucide-react';

// Navigation items configuration
const navigation = [
  {
    name: 'User Management',
    href: '/admin/users',
    icon: Users,
    description: 'Manage users, roles, and permissions'
  },
  {
    name: 'System Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'Configure system-wide settings and preferences'
  },
  {
    name: 'Content Moderation',
    href: '/admin/moderation',
    icon: Shield,
    description: 'Review and moderate user-generated content'
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    description: 'View system analytics and reports'
  },
  {
    name: 'Subscriptions',
    href: '/admin/subscriptions',
    icon: CreditCard,
    description: 'Manage subscription plans and billing'
  }
];

// Helper function to generate breadcrumbs
function generateBreadcrumbs(pathname: string) {
  const paths = pathname.split('/').filter(Boolean);
  return paths.map((path, index) => ({
    name: path.charAt(0).toUpperCase() + path.slice(1),
    href: '/' + paths.slice(0, index + 1).join('/'),
    current: index === paths.length - 1
  }));
}

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // State management
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const supabase = createClient();

  // Load current user data
  useEffect(() => {
    async function loadUser() {
      try {
        const {
          data: { user },
          error
        } = await supabase.auth.getUser();
        if (error) throw error;
        setCurrentUser(user);
      } catch (err) {
        console.error('Error loading user:', err);
      } finally {
        setIsLoading(false);
      }
    }

    void loadUser();
  }, [supabase]);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Redirect will be handled by auth middleware
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  // Generate breadcrumbs for current path
  const breadcrumbs = generateBreadcrumbs(pathname || '');

  return (
    <div className="flex h-screen bg-zinc-950">
      {/* Mobile sidebar backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-zinc-950/80 lg:hidden ${
          sidebarOpen ? 'block' : 'hidden'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-zinc-900 p-6 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Admin Panel</h2>
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-6 w-6 text-zinc-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-500/10 text-blue-500'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="flex-1">{item.name}</span>
                {isActive && (
                  <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-500">
                    Current
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User profile section */}
        {!isLoading && currentUser && (
          <div className="mt-auto pt-6">
            <div className="flex items-center gap-3 rounded-lg bg-zinc-800/50 px-3 py-2">
              <div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center">
                <User className="h-4 w-4 text-zinc-400" />
              </div>
              <div className="flex-1 truncate">
                <p className="text-sm font-medium text-white truncate">
                  {currentUser.email}
                </p>
                <p className="text-xs text-zinc-400">Administrator</p>
              </div>
              <button
                onClick={handleSignOut}
                className="rounded-md p-1 hover:bg-zinc-700"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4 text-zinc-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {/* Mobile header */}
        <div className="border-b border-zinc-800 bg-zinc-900 p-4 lg:hidden">
          <button
            className="text-zinc-400"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Breadcrumbs */}
        <div className="border-b border-zinc-800 bg-zinc-900 px-6 py-3">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              {breadcrumbs.map((breadcrumb, index) => (
                <li key={breadcrumb.href}>
                  <div className="flex items-center">
                    {index > 0 && (
                      <ChevronRight className="h-4 w-4 text-zinc-400 mx-2" />
                    )}
                    <Link
                      href={breadcrumb.href}
                      className={`text-sm font-medium ${
                        breadcrumb.current
                          ? 'text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                      aria-current={breadcrumb.current ? 'page' : undefined}
                    >
                      {breadcrumb.name}
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
