import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';

// Mock console.error to avoid noise in test output
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('DashboardErrorBoundary', () => {
  const ErrorComponent = () => {
    throw new Error('Test error');
    return null;
  };

  it('should render children when no error occurs', () => {
    render(
      <DashboardErrorBoundary>
        <div data-testid="child">Test content</div>
      </DashboardErrorBoundary>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should render error UI when error occurs', () => {
    render(
      <DashboardErrorBoundary>
        <ErrorComponent />
      </DashboardErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('should render custom fallback when provided', () => {
    const fallback = <div data-testid="custom-fallback">Custom error UI</div>;

    render(
      <DashboardErrorBoundary fallback={fallback}>
        <ErrorComponent />
      </DashboardErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
  });

  it('should reset error state when try again is clicked', () => {
    const { rerender } = render(
      <DashboardErrorBoundary>
        <ErrorComponent />
      </DashboardErrorBoundary>
    );

    // Click try again
    fireEvent.click(screen.getByText('Try again'));

    // Rerender with working component
    rerender(
      <DashboardErrorBoundary>
        <div data-testid="recovered">Recovered content</div>
      </DashboardErrorBoundary>
    );

    expect(screen.getByTestId('recovered')).toBeInTheDocument();
  });

  it('should log error details when error occurs', () => {
    render(
      <DashboardErrorBoundary>
        <ErrorComponent />
      </DashboardErrorBoundary>
    );

    expect(console.error).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      'Dashboard error:',
      expect.any(Error),
      expect.any(Object)
    );
  });
});
