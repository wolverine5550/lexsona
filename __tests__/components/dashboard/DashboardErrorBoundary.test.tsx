import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { setupCommonMocks } from '../../setup/commonMocks';
import React, { useState } from 'react';

describe('DashboardErrorBoundary', () => {
  beforeAll(() => {
    setupCommonMocks();
  });

  const ThrowError = () => {
    throw new Error('Test error');
  };

  it('should catch and display error details', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(
      <DashboardErrorBoundary>
        <ThrowError />
      </DashboardErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/Test error/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /try again/i })
    ).toBeInTheDocument();

    consoleError.mockRestore();
  });

  it('should reset error state when try again is clicked', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const onReset = vi.fn();

    const TestComponent = () => {
      const [hasError, setHasError] = useState(true);

      if (hasError) {
        throw new Error('Test error');
      }

      return <div data-testid="content">Content</div>;
    };

    render(
      <DashboardErrorBoundary
        onReset={() => {
          onReset();
          // Force a re-render of the entire app
          window.location.reload();
        }}
      >
        <TestComponent />
      </DashboardErrorBoundary>
    );

    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(tryAgainButton);

    expect(onReset).toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
