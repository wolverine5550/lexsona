/**
 * Layout component for the onboarding flow.
 * This wraps all onboarding pages and provides common UI elements.
 * It shows the progress steps and maintains consistent styling.
 */
export default function OnboardingLayout({
  children
}: {
  children: React.ReactNode;
}) {
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
          {children}
        </div>
      </div>
    </div>
  );
}
