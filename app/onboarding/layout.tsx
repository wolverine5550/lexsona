'use client';

import { ProgressSteps } from '@/components/ui/ProgressSteps';
import {
  OnboardingProvider,
  useOnboarding
} from '@/contexts/OnboardingContext';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

/**
 * Inner layout component that uses the onboarding context
 * Separated to avoid context usage in the main layout component
 */
function OnboardingLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { steps, currentStepIndex, setCurrentStepIndex, canProceed } =
    useOnboarding();

  // Get current step data
  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  /**
   * Handle navigation between steps
   */
  const handleNavigation = (direction: 'back' | 'next') => {
    if (direction === 'back' && currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      router.push(steps[currentStepIndex - 1].path);
    } else if (direction === 'next' && !isLastStep) {
      setCurrentStepIndex(currentStepIndex + 1);
      router.push(steps[currentStepIndex + 1].path);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="mx-auto max-w-2xl px-4 py-16">
        {/* Header section */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">Welcome to Lexsona</h1>
          <p className="mt-2 text-zinc-400">
            Let's get your author profile set up
          </p>
        </div>

        {/* Content Card */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950">
          {/* Progress Steps */}
          <div className="p-6 border-b border-zinc-800">
            <ProgressSteps
              steps={steps.map((step) => ({
                ...step,
                completed: step.completed,
                current: step.current
              }))}
              currentStep={currentStepIndex}
            />
          </div>

          {/* Form Content */}
          <div className="p-6">{children}</div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between p-6 border-t border-zinc-800">
            <Button
              variant="flat"
              onClick={() => handleNavigation('back')}
              disabled={currentStepIndex === 0}
            >
              Back
            </Button>

            <Button
              onClick={() => handleNavigation('next')}
              disabled={!canProceed || isLastStep}
            >
              {isLastStep ? 'Complete' : 'Continue'}
            </Button>
          </div>
        </div>

        {/* Skip Link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Main layout component that provides the onboarding context
 */
export default function OnboardingLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingProvider>
      <OnboardingLayoutInner>{children}</OnboardingLayoutInner>
    </OnboardingProvider>
  );
}
