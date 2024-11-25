'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useScrollTo } from '@/hooks/useScrollTo';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function NavLink({
  href,
  children,
  className = '',
  onClick
}: NavLinkProps) {
  const pathname = usePathname();
  const scrollTo = useScrollTo();

  // Check if this is a hash link and we're on the homepage
  const isHashLink = href.startsWith('#');
  const isHomePage = pathname === '/';

  // Determine if link is active
  const isActive =
    pathname === href ||
    (href !== '/' && pathname.startsWith(href)) ||
    (isHashLink && isHomePage && pathname + href === pathname + href);

  const handleClick = (e: React.MouseEvent) => {
    // If it's a hash link and we're on the homepage
    if (isHashLink && isHomePage) {
      e.preventDefault();
      scrollTo(href);
    }

    // Call the original onClick if provided
    onClick?.();
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={`relative text-sm transition-colors ${
        isActive ? 'text-white' : 'text-zinc-300 hover:text-white'
      } ${className}`}
    >
      {children}
      {/* Active indicator line */}
      <span
        className={`absolute -bottom-1 left-0 h-0.5 w-full transform bg-blue-500 transition-transform duration-150 ${
          isActive ? 'scale-x-100' : 'scale-x-0'
        }`}
      />
    </Link>
  );
}
