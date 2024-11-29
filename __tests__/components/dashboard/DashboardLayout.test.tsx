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

    // Find links
    const links = screen.getAllByRole('link');
    const activeLink = links.find(
      (link) => link.getAttribute('data-active') === 'true'
    );
    const inactiveLink = links.find(
      (link) => link.getAttribute('data-active') === 'false'
    );

    expect(activeLink).toHaveTextContent('Podcasts');
    expect(inactiveLink).toHaveTextContent('Dashboard');
  });
});
