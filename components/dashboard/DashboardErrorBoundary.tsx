'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary for Dashboard components
 * Catches and handles errors in the dashboard feature
 */
export class DashboardErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center">
          <h2 className="text-lg font-semibold text-red-500">
            Something went wrong
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {this.state.error?.message}
          </p>
          <button
            onClick={this.handleReset}
            className="mt-4 rounded-md bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
