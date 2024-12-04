'use client';

interface Step {
  title: string;
  path: string;
  completed: boolean;
  current: boolean;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
}

export function ProgressSteps({ steps, currentStep }: ProgressStepsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div
            key={step.path}
            className={`flex items-center ${
              index !== steps.length - 1 ? 'flex-1' : ''
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                step.completed
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : step.current
                    ? 'border-blue-500 text-blue-500'
                    : 'border-zinc-700 text-zinc-700'
              }`}
            >
              {step.completed ? '✓' : index + 1}
            </div>
            {index !== steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 ${
                  step.completed ? 'bg-blue-500' : 'bg-zinc-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between px-2">
        {steps.map((step) => (
          <span
            key={step.path}
            className={`text-sm ${
              step.current || step.completed ? 'text-white' : 'text-zinc-500'
            }`}
          >
            {step.title}
          </span>
        ))}
      </div>
    </div>
  );
}
