'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardHeader, CardContent } from './Card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary component to catch JavaScript errors anywhere in their child component tree
 * Logs errors and displays a fallback UI instead of crashing the app
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <h2 className="text-lg font-semibold text-red-600">
                Something went wrong
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Try again
              </button>
            </CardContent>
          </Card>
        )
      );
    }

    return this.props.children;
  }
}
