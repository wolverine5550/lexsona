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

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('My Books')).toBeInTheDocument();
    expect(screen.getByText('Podcasts')).toBeInTheDocument();
  });

  it('should toggle mobile sidebar', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    // Sidebar should be hidden initially
    expect(screen.getByRole('navigation').parentElement).toHaveClass('hidden');

    // Open sidebar
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('navigation').parentElement).toHaveClass('block');

    // Close sidebar
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.getByRole('navigation').parentElement).toHaveClass('hidden');
  });

  it('should highlight active navigation item', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    const activeLink = screen.getByText('Overview').closest('a');
    expect(activeLink).toHaveClass('bg-blue-500/10');
  });
});
