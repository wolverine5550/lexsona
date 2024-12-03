import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TicketList } from '@/components/help/tickets/TicketList';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>
}));

describe('TicketList Component', () => {
  const mockTickets = [
    {
      id: '1',
      title: 'Test Ticket 1',
      status: 'open' as const,
      category: 'Technical Issue',
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Test Ticket 2',
      status: 'in_progress' as const,
      category: 'Billing',
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    }
  ];

  // Rendering tests
  describe('Rendering', () => {
    it('should render tickets correctly', () => {
      render(<TicketList tickets={mockTickets} />);

      expect(screen.getByText('Test Ticket 1')).toBeInTheDocument();
      expect(screen.getByText('Test Ticket 2')).toBeInTheDocument();
      expect(screen.getByText('Technical Issue')).toBeInTheDocument();
      expect(screen.getByText('Billing')).toBeInTheDocument();
    });

    it('should render correct status badges', () => {
      render(<TicketList tickets={mockTickets} />);

      expect(screen.getByText('Open')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    it('should render ticket links correctly', () => {
      render(<TicketList tickets={mockTickets} />);

      const links = screen.getAllByRole('link');
      expect(links[0]).toHaveAttribute('href', '/help/tickets/1');
      expect(links[1]).toHaveAttribute('href', '/help/tickets/2');
    });

    it('should handle empty tickets array', () => {
      render(<TicketList tickets={[]} />);
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });
  });

  // Status color tests
  describe('Status Colors', () => {
    it('should apply correct color classes for different statuses', () => {
      render(<TicketList tickets={mockTickets} />);

      // Open status should have yellow color
      const openBadge = screen.getByText('Open');
      expect(openBadge).toHaveClass('bg-yellow-500/10', 'text-yellow-500');

      // In Progress status should have blue color
      const inProgressBadge = screen.getByText('In Progress');
      expect(inProgressBadge).toHaveClass('bg-blue-500/10', 'text-blue-500');
    });
  });

  // Time formatting tests
  describe('Time Formatting', () => {
    it('should format creation time correctly', () => {
      const recentDate = new Date();
      const tickets = [
        {
          ...mockTickets[0],
          created_at: recentDate.toISOString()
        }
      ];

      render(<TicketList tickets={tickets} />);
      expect(screen.getByText(/less than a minute ago/i)).toBeInTheDocument();
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('should have accessible status indicators', () => {
      render(<TicketList tickets={mockTickets} />);

      // Check "Open" status
      const openBadge = screen.getByText('Open');
      expect(openBadge).toBeVisible();
      expect(openBadge).toHaveClass('bg-yellow-500/10', 'text-yellow-500');

      // Check "In Progress" status
      const inProgressBadge = screen.getByText('In Progress');
      expect(inProgressBadge).toBeVisible();
      expect(inProgressBadge).toHaveClass('bg-blue-500/10', 'text-blue-500');
    });

    it('should have accessible links', () => {
      render(<TicketList tickets={mockTickets} />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAttribute('href');
        expect(link).toBeVisible();
      });
    });
  });
});
