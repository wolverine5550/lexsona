'use client';

import { createClient } from '@/utils/supabase/client';
import s from './Navbar.module.css';
import Link from 'next/link';
import Logo from '@/components/icons/Logo';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { UserDropdown } from '@/components/ui/UserDropdown';
import { NavLink } from '@/components/ui/NavLink';
import { usePathname } from 'next/navigation';

// Navigation items configuration
const navItems = [
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' }
];

export default function Navbar({ user }: { user: any }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Handle scroll behavior and close menu on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      setHasScrolled(scrollTop > 10);

      // Close mobile menu when scrolling
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobileMenuOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        isMobileMenuOpen &&
        !target.closest('#mobile-menu') &&
        !target.closest('#mobile-menu-button')
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        hasScrolled
          ? 'bg-zinc-900/95 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      } ${isMobileMenuOpen ? 'bg-zinc-900' : ''}`}
    >
      {/* Border that only shows after scrolling */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-[1px] transition-opacity duration-300 ${
          hasScrolled ? 'opacity-100' : 'opacity-0'
        } bg-gradient-to-r from-transparent via-zinc-700 to-transparent`}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Logo />
              <span className="ml-3 text-lg font-bold text-white">Lexsona</span>
            </Link>

            {/* Desktop Navigation Items */}
            <div className="hidden md:ml-10 md:flex md:items-center md:space-x-6">
              {navItems.map((item) => (
                <NavLink key={item.href} href={item.href}>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Mobile Menu Button - Enhanced with accessibility */}
          <div className="flex md:hidden">
            <button
              id="mobile-menu-button"
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsMobileMenuOpen(false);
                }
              }}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              className="inline-flex items-center justify-center rounded-md p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {user ? (
              <UserDropdown
                user={user}
                onSignOut={() => {
                  const supabase = createClient();
                  supabase.auth.signOut();
                }}
              />
            ) : (
              <>
                <Link
                  href="/signin"
                  className="text-sm font-medium text-zinc-300 hover:text-white"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-md bg-blue-500 px-3 py-2 text-sm font-medium text-white hover:bg-blue-600"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu - Enhanced with accessibility and ARIA */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-menu-button"
        className={`transform overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen
            ? 'max-h-[400px] border-t border-zinc-800'
            : 'max-h-0'
        }`}
      >
        {/* Menu Background with Blur - Animated */}
        <div
          className={`bg-zinc-900/95 backdrop-blur-md transform transition-all duration-300 ${
            isMobileMenuOpen
              ? 'translate-y-0 opacity-100'
              : '-translate-y-4 opacity-0'
          }`}
        >
          <div className="space-y-1 px-4 pb-3 pt-2">
            {/* Mobile Navigation Items - Staggered Animation */}
            {navItems.map((item, index) => (
              <div
                key={item.href}
                className={`transform transition-all duration-300 ${
                  isMobileMenuOpen
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-4 opacity-0'
                }`}
                style={{
                  transitionDelay: `${index * 100}ms`
                }}
              >
                <NavLink
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-base font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              </div>
            ))}

            {/* Mobile Auth Buttons - Staggered Animation */}
            <div
              className={`transform transition-all duration-300 ${
                isMobileMenuOpen
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-4 opacity-0'
              }`}
              style={{
                transitionDelay: `${navItems.length * 100}ms`
              }}
            >
              {user ? (
                <Link
                  href="/dashboard"
                  className="block rounded-md px-3 py-2 text-base font-medium text-white hover:bg-zinc-800"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/signin"
                    className="block rounded-md px-3 py-2 text-base font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    className="block rounded-md px-3 py-2 text-base font-medium text-white bg-blue-500 hover:bg-blue-600"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
