import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardLoadingState } from '@/components/dashboard/DashboardLoadingState';

describe('DashboardLoadingState', () => {
  it('should render children when not loading and no error', () => {
    render(
      <DashboardLoadingState loading={false} error={null}>
        <div data-testid="child">Test content</div>
      </DashboardLoadingState>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should render loading state when loading', () => {
    render(
      <DashboardLoadingState loading={true} error={null}>
        <div>Test content</div>
      </DashboardLoadingState>
    );

    const loadingElement = screen.getByTestId('loading-skeleton');
    expect(loadingElement).toHaveClass('animate-pulse');
    expect(loadingElement.children).toHaveLength(2); // Two skeleton lines
  });

  it('should render custom loading fallback when provided', () => {
    render(
      <DashboardLoadingState
        loading={true}
        error={null}
        loadingFallback={<div data-testid="custom-loading">Loading...</div>}
      >
        <div>Test content</div>
      </DashboardLoadingState>
    );

    expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
  });

  it('should render error state when error exists', () => {
    const errorMessage = 'Test error message';
    render(
      <DashboardLoadingState loading={false} error={errorMessage}>
        <div>Test content</div>
      </DashboardLoadingState>
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText(errorMessage).parentElement).toHaveClass(
      'bg-red-50'
    );
  });

  it('should render custom error fallback when provided', () => {
    const errorMessage = 'Test error message';
    render(
      <DashboardLoadingState
        loading={false}
        error={errorMessage}
        errorFallback={(error) => (
          <div data-testid="custom-error">Custom error: {error}</div>
        )}
      >
        <div>Test content</div>
      </DashboardLoadingState>
    );

    const errorElement = screen.getByTestId('custom-error');
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveTextContent(`Custom error: ${errorMessage}`);
  });

  it('should prioritize error over loading state', () => {
    render(
      <DashboardLoadingState loading={true} error="Test error">
        <div>Test content</div>
      </DashboardLoadingState>
    );

    expect(screen.getByText('Test error')).toBeInTheDocument();
    expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
  });

  it('should not render children when loading', () => {
    render(
      <DashboardLoadingState loading={true} error={null}>
        <div data-testid="child">Test content</div>
      </DashboardLoadingState>
    );

    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  it('should not render children when error exists', () => {
    render(
      <DashboardLoadingState loading={false} error="Test error">
        <div data-testid="child">Test content</div>
      </DashboardLoadingState>
    );

    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });
});
