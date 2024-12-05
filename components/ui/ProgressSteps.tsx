'use client';

import { useOnboarding } from '@/hooks/useOnboarding';
import { CheckIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { OnboardingStep } from '@/contexts/OnboardingContext';

const steps = [
  {
    title: 'Author Profile',
    path: '/onboarding/profile'
  },
  {
    title: 'Book Details',
    path: '/onboarding/book'
  },
  {
    title: 'Podcast Preferences',
    path: '/onboarding/podcast-preferences'
  }
];

export function ProgressSteps() {
  const { currentStep, isStepComplete } = useOnboarding();
  const pathname = usePathname();

  return (
    <nav aria-label="Progress">
      <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
        {steps.map((step, index) => {
          const stepNumber = index as OnboardingStep;
          const completed = isStepComplete(stepNumber);
          const current = stepNumber === currentStep;

          return (
            <li key={step.title} className="md:flex-1">
              <div
                className={`group flex flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4 ${
                  completed
                    ? 'border-blue-600 hover:border-blue-800'
                    : current
                      ? 'border-blue-600'
                      : 'border-zinc-800 hover:border-zinc-600'
                }`}
              >
                <span
                  className={`flex items-center text-sm font-medium ${
                    completed
                      ? 'text-blue-600 group-hover:text-blue-800'
                      : current
                        ? 'text-blue-600'
                        : 'text-zinc-500 group-hover:text-zinc-400'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      completed
                        ? 'bg-blue-600 group-hover:bg-blue-800'
                        : current
                          ? 'border-2 border-blue-600 bg-blue-600/10'
                          : 'border-2 border-zinc-800 group-hover:border-zinc-600'
                    }`}
                  >
                    {completed ? (
                      <CheckIcon
                        className="h-4 w-4 text-white"
                        aria-hidden="true"
                      />
                    ) : current ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                    ) : (
                      <span className="h-2.5 w-2.5 rounded-full" />
                    )}
                  </span>
                  <span className="ml-3">Step {index + 1}</span>
                </span>
                <span
                  className={`mt-1 ml-9 text-sm font-medium ${
                    completed || current ? 'text-zinc-200' : 'text-zinc-500'
                  }`}
                >
                  {step.title}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
