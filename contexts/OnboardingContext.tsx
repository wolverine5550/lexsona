'use client';

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect
} from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export type OnboardingStep = 0 | 1 | 2 | 3;

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
  },
  {
    title: 'Choose Plan',
    path: '/onboarding/pricing'
  }
];

export interface OnboardingContextType {
  currentStep: OnboardingStep;
  completedSteps: Set<OnboardingStep>;
  markStepComplete: (step: OnboardingStep) => Promise<void>;
  isStepComplete: (step: OnboardingStep) => boolean;
}

export const OnboardingContext = createContext<
  OnboardingContextType | undefined
>(undefined);

export function OnboardingProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(0);
  const [completedSteps, setCompletedSteps] = useState<Set<OnboardingStep>>(
    new Set()
  );

  // Check for existing profile and book on mount and when pathname changes
  useEffect(() => {
    const checkProgress = async () => {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (user) {
        // Check for author profile
        const { data: profile } = await supabase
          .from('author_profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        // Check for book
        const { data: book } = await supabase
          .from('books')
          .select('id')
          .eq('author_id', user.id)
          .single();

        setCompletedSteps((prev) => {
          const newSet = new Set(prev);

          // Mark profile step as complete if profile exists
          if (profile) {
            newSet.add(0);
          }

          // Mark book step as complete if book exists
          if (book) {
            newSet.add(1);
          }

          // If we're on the podcast preferences page, mark previous steps as complete
          if (pathname?.includes('/podcast-preferences')) {
            newSet.add(0);
            newSet.add(1);
          }
          // If we're on the book page, mark profile step as complete
          else if (pathname?.includes('/book')) {
            newSet.add(0);
          }

          return newSet;
        });

        // Set current step based on pathname
        if (pathname) {
          if (pathname.includes('/podcast-preferences')) {
            setCurrentStep(2);
          } else if (pathname.includes('/book')) {
            setCurrentStep(1);
          } else {
            setCurrentStep(0);
          }
        }
      }
    };

    checkProgress();
  }, [pathname]);

  const markStepComplete = async (step: OnboardingStep) => {
    setCompletedSteps((prev) => {
      const newSet = new Set(prev);
      // Mark the current step and all previous steps as complete
      for (let i = 0; i <= step; i++) {
        newSet.add(i as OnboardingStep);
      }
      return newSet;
    });

    // Move to next step if available
    if (step < 3) {
      setCurrentStep((step + 1) as OnboardingStep);
    }
  };

  const isStepComplete = (step: OnboardingStep) => {
    return completedSteps.has(step);
  };

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        completedSteps,
        markStepComplete,
        isStepComplete
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
