'use client';

import { ProgressSteps } from '@/components/ui/ProgressSteps';
import {
  OnboardingProvider,
  useOnboarding
} from '@/contexts/OnboardingContext';
import { Suspense } from 'react';
import { usePathname } from 'next/navigation';

function OnboardingLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Get header text based on current page
  const getHeaderText = () => {
    if (pathname?.includes('/podcast-preferences')) {
      return 'Tell us about your podcast preferences';
    } else if (pathname?.includes('/book')) {
      return 'Tell us about your book';
    }
    return "Let's get your author profile set up";
  };

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="mx-auto max-w-2xl px-4 pt-24 pb-16">
        {/* Header section */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">Welcome to Lexsona</h1>
          <p className="mt-2 text-zinc-400">{getHeaderText()}</p>
        </div>

        {/* Content Card */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950">
          {/* Progress Steps */}
          <div className="p-6 border-b border-zinc-800">
            <ProgressSteps />
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
