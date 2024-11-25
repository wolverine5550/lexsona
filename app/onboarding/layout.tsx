/**
 * Layout component for the onboarding flow.
 * This wraps all onboarding pages and provides common UI elements.
 * It shows the progress steps and maintains consistent styling.
 */
import { ProgressSteps } from '@/components/ui/ProgressSteps';

export default function OnboardingLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const steps = [
    {
      id: 1,
      title: 'Create Profile',
      description: 'Add your bio and expertise',
      completed: false,
      current: true
    },
    {
      id: 2,
      title: 'Add Book',
      description: 'Enter your book details',
      completed: false,
      current: false
    }
    // Add more steps as needed
  ];

  return (
    // Full-height container with dark theme
    <div className="min-h-screen bg-zinc-900">
      {/* Center content with max width */}
      <div className="mx-auto max-w-2xl px-4 py-16">
        {/* Header section */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">Welcome to Lexsona</h1>
          <p className="mt-2 text-zinc-400">
            Let's get your author profile set up
          </p>
        </div>

        {/* Page content */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6">
          <ProgressSteps steps={steps} currentStep={0} />
          {children}
        </div>
      </div>
    </div>
  );
}
