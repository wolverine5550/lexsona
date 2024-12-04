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

interface Step {
  title: string;
  path: string;
  completed: boolean;
  current: boolean;
}

interface OnboardingContextType {
  steps: Step[];
  currentStepIndex: number;
  markStepComplete: (index: number) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [steps, setSteps] = useState<Step[]>([
    {
      title: 'Author Profile',
      path: '/onboarding/profile',
      completed: false,
      current: pathname === '/onboarding/profile'
    },
    {
      title: 'Book Details',
      path: '/onboarding/book',
      completed: false,
      current: pathname === '/onboarding/book'
    }
  ]);

  // Check for existing profile on mount
  useEffect(() => {
    const checkProfile = async () => {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('author_profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (profile) {
          setSteps(
            steps.map((step, index) => ({
              ...step,
              completed: index === 0 ? true : step.completed
            }))
          );
        }
      }
    };

    checkProfile();
  }, []);

  // Update current step based on pathname
  useEffect(() => {
    setSteps(
      steps.map((step) => ({
        ...step,
        current: step.path === pathname
      }))
    );
  }, [pathname]);

  const markStepComplete = (index: number) => {
    setSteps(
      steps.map((step, i) => {
        if (i === index) {
          return { ...step, completed: true, current: false };
        }
        if (i === index + 1) {
          return { ...step, current: true };
        }
        return step;
      })
    );
  };

  return (
    <OnboardingContext.Provider
      value={{
        steps,
        currentStepIndex: steps.findIndex((step) => step.current),
        markStepComplete
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
