'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global Error Boundary component
 * Catches JavaScript errors anywhere in the child component tree
 * Displays a fallback UI instead of the component tree that crashed
 */
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * Update state when an error occurs
   * This is called during the "render" phase
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  /**
   * Perform side effects after an error occurs
   * This is called during the "commit" phase
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to an error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
  }

  /**
   * Reset error state and retry rendering
   */
  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI or the provided fallback
      return (
        this.props.fallback || (
          <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 rounded-lg border border-red-500/20 bg-red-500/10 p-8 text-center">
            <h2 className="text-xl font-semibold text-red-500">
              Something went wrong
            </h2>
            <p className="max-w-md text-sm text-zinc-400">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={this.handleRetry}
              className="rounded-md bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600"
            >
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap components with ErrorBoundary
 * Provides a cleaner way to use error boundaries
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;
