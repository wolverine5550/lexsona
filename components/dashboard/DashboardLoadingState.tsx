import type { ReactNode } from 'react';

interface Props {
  loading: boolean;
  error: string | null;
  children: ReactNode;
  loadingFallback?: ReactNode;
  errorFallback?: (error: string) => ReactNode;
}

/**
 * Loading and error state handler for dashboard components
 * Provides consistent loading and error UI across the dashboard
 */
export function DashboardLoadingState({
  loading,
  error,
  children,
  loadingFallback,
  errorFallback
}: Props) {
  // Show error state if there's an error
  if (error) {
    return (
      errorFallback?.(error) ?? (
        <div className="p-4 rounded-lg bg-red-50 text-red-800">
          <p className="text-sm">{error}</p>
        </div>
      )
    );
  }

  // Show loading state if loading
  if (loading) {
    return (
      loadingFallback ?? (
        <div className="p-4 animate-pulse" data-testid="loading-skeleton">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      )
    );
  }

  // Show children when not loading and no error
  return <>{children}</>;
}
