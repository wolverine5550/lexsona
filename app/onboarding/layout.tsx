'use client';

import { ProgressSteps } from '@/components/ui/ProgressSteps';
import {
  OnboardingProvider,
  useOnboarding
} from '@/contexts/OnboardingContext';
import { Suspense } from 'react';

function OnboardingLayoutInner({ children }: { children: React.ReactNode }) {
  const { steps, currentStepIndex } = useOnboarding();

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="mx-auto max-w-2xl px-4 pt-24 pb-16">
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
            <ProgressSteps steps={steps} currentStep={currentStepIndex} />
          </div>

          {/* Form Content */}
          <div className="p-6">
            <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

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
