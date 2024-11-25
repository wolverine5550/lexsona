'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
}

export function ProgressSteps({ steps, currentStep }: ProgressStepsProps) {
  // Calculate progress percentage
  const progress = (currentStep / (steps.length - 1)) * 100;

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <Progress value={progress} className="h-2" />

      {/* Steps */}
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              'rounded-lg border p-4',
              step.current
                ? 'border-blue-500 bg-blue-500/10'
                : step.completed
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-zinc-800 bg-zinc-950'
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'rounded-full p-2 text-sm',
                  step.completed
                    ? 'bg-green-500/20 text-green-500'
                    : step.current
                      ? 'bg-blue-500/20 text-blue-500'
                      : 'bg-zinc-800 text-zinc-400'
                )}
              >
                {step.completed ? '✓' : step.id}
              </div>
              <div>
                <h3 className="font-medium text-white">{step.title}</h3>
                <p className="text-sm text-zinc-400">{step.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
