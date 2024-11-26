'use client';

import { createContext, useContext, useState } from 'react';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  path: string;
  completed: boolean;
  current: boolean;
}

interface OnboardingContextType {
  steps: OnboardingStep[];
  currentStepIndex: number;
  setCurrentStepIndex: (index: number) => void;
  markStepComplete: (stepId: number) => void;
  canProceed: boolean;
  setCanProceed: (value: boolean) => void;
}

// Define onboarding steps
const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: 'Create Profile',
    description: 'Add your bio and expertise',
    path: '/onboarding/profile',
    completed: false,
    current: true
  },
  {
    id: 2,
    title: 'Add Book',
    description: 'Enter your book details',
    path: '/onboarding/book',
    completed: false,
    current: false
  }
];

// Create context
const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

// Provider component
export function OnboardingProvider({
  children
}: {
  children: React.ReactNode;
}) {
  // Track current step
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Track step completion
  const [steps, setSteps] = useState(ONBOARDING_STEPS);

  // Track if current step is valid and can proceed
  const [canProceed, setCanProceed] = useState(false);

  // Mark a step as complete
  const markStepComplete = (stepId: number) => {
    setSteps((prevSteps) =>
      prevSteps.map((step) =>
        step.id === stepId ? { ...step, completed: true } : step
      )
    );
  };

  return (
    <OnboardingContext.Provider
      value={{
        steps,
        currentStepIndex,
        setCurrentStepIndex,
        markStepComplete,
        canProceed,
        setCanProceed
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

// Custom hook to use the context
export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
