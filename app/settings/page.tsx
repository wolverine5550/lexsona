import { AuthorSettings } from '@/components/settings/AuthorSettings';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

/**
 * Author Settings Page
 * Provides a user interface for authors to manage their profile and podcast preferences
 * Wrapped in an error boundary to handle runtime errors gracefully
 */
export default function SettingsPage() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>
      <ErrorBoundary>
        <AuthorSettings />
      </ErrorBoundary>
    </main>
  );
}
