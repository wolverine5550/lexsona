import { render, screen } from '@testing-library/react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { describe, it, expect, vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/podcasts'
}));

describe('DashboardLayout', () => {
  it('should highlight active navigation item', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    // Find the active link
    const activeLink = screen.getByRole('link', { name: 'Podcasts' });
    expect(activeLink.className).toContain('bg-zinc-800');
    expect(activeLink.className).toContain('text-white');

    // Find an inactive link
    const inactiveLink = screen.getByRole('link', { name: 'Dashboard' });
    expect(inactiveLink.className).toContain('text-zinc-400');
  });
});
