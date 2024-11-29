import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { describe, it, expect, vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard'
}));

describe('DashboardLayout', () => {
  it('should render navigation items', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    // Use getAllByRole and check the first instance (desktop nav)
    const navLinks = screen.getAllByRole('navigation')[0];
    expect(navLinks.querySelector('a[href="/dashboard"]')).toHaveTextContent(
      'Overview'
    );
    expect(
      navLinks.querySelector('a[href="/dashboard/books"]')
    ).toHaveTextContent('My Books');
    expect(
      navLinks.querySelector('a[href="/dashboard/podcasts"]')
    ).toHaveTextContent('Podcasts');
  });

  it('should toggle mobile sidebar', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    // Get the mobile menu button and sidebar
    const menuButton = screen.getByRole('button', {
      name: 'Toggle mobile menu'
    });
    const mobileNav = screen.getByRole('navigation', {
      name: 'Mobile navigation'
    });

    // Initially sidebar should be hidden
    expect(mobileNav.parentElement?.parentElement).toHaveClass('hidden');

    // Click to open
    fireEvent.click(menuButton);
    expect(mobileNav.parentElement?.parentElement).not.toHaveClass('hidden');

    // Click close button
    const closeButton = screen.getByRole('button', {
      name: 'Close mobile menu'
    });
    fireEvent.click(closeButton);
    expect(mobileNav.parentElement?.parentElement).toHaveClass('hidden');
  });

  it('should highlight active navigation item', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    // Get the first navigation (desktop) and find the active link
    const desktopNav = screen.getAllByRole('navigation')[0];
    const activeLink = desktopNav.querySelector('a[href="/dashboard"]');
    const inactiveLink = desktopNav.querySelector('a[href="/dashboard/books"]');

    expect(activeLink).toHaveClass('bg-blue-500/10', 'text-blue-500');
    expect(inactiveLink).not.toHaveClass('bg-blue-500/10', 'text-blue-500');
  });
});
