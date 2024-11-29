import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';

describe('DashboardErrorBoundary', () => {
  const consoleErrorSpy = vi
    .spyOn(console, 'error')
    .mockImplementation(() => {});

  beforeEach(() => {
    consoleErrorSpy.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should reset error state when try again is clicked', () => {
    const TestComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div data-testid="test-content">Content</div>;
    };

    const { rerender } = render(
      <DashboardErrorBoundary>
        <TestComponent shouldThrow={true} />
      </DashboardErrorBoundary>
    );

    // Error boundary should catch error and show error UI
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();

    // Click try again button
    const tryAgainButton = screen.getByText('Try again');
    fireEvent.click(tryAgainButton);

    // Rerender with shouldThrow=false
    rerender(
      <DashboardErrorBoundary>
        <TestComponent shouldThrow={false} />
      </DashboardErrorBoundary>
    );

    // Should show recovered content
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('should log error details when error occurs', () => {
    const ErrorComponent = () => {
      throw new Error('Test error');
    };

    render(
      <DashboardErrorBoundary>
        <ErrorComponent />
      </DashboardErrorBoundary>
    );

    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorCall = consoleErrorSpy.mock.calls.find(
      (call) => call[0] === 'Error caught by boundary:'
    );
    expect(errorCall).toBeTruthy();
    if (errorCall) {
      expect(errorCall[1]).toBeInstanceOf(Error);
      expect(errorCall[1].message).toBe('Test error');
      expect(errorCall[2]).toHaveProperty('componentStack');
    }
  });
});
