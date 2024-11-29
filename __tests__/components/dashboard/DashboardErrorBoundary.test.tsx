import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { Component } from 'react';

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

  it('should reset error state when try again is clicked', async () => {
    let shouldThrow = true;

    const TestComponent = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div data-testid="test-content">Content</div>;
    };

    const { rerender } = render(
      <DashboardErrorBoundary>
        <TestComponent />
      </DashboardErrorBoundary>
    );

    // Error boundary should catch error and show error UI
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();

    // Update the flag before clicking try again
    shouldThrow = false;

    // Click try again button
    await act(async () => {
      fireEvent.click(screen.getByText('Try again'));
    });

    // Rerender after state update
    rerender(
      <DashboardErrorBoundary>
        <TestComponent />
      </DashboardErrorBoundary>
    );

    // Should show recovered content
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('should catch and display error details', () => {
    class ThrowingComponent extends Component {
      componentDidMount() {
        throw new Error('Test error');
      }

      render() {
        return null;
      }
    }

    render(
      <DashboardErrorBoundary>
        <ThrowingComponent />
      </DashboardErrorBoundary>
    );

    // Verify error UI is shown with correct error message
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });
});
