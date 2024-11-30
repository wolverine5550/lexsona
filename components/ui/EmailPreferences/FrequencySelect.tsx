'use client';

import { type EmailFrequency } from '@/types/settings';

interface FrequencySelectProps {
  value: EmailFrequency;
  onChange: (value: EmailFrequency) => void;
  disabled?: boolean;
  name: string;
  error?: string;
}

/**
 * Frequency selection component for email preferences
 * Allows users to choose how often they receive different types of emails
 */
export function FrequencySelect({
  value,
  onChange,
  disabled = false,
  name,
  error
}: FrequencySelectProps) {
  // Define frequency options with labels
  const options = [
    { value: 'immediate', label: 'Immediately' },
    { value: 'daily', label: 'Daily Digest' },
    { value: 'weekly', label: 'Weekly Digest' },
    { value: 'never', label: 'Never' }
  ] as const;

  // Add 'frequency-' prefix to IDs
  const errorId = `frequency-${name}-error`;
  const selectId = `frequency-${name}`;

  return (
    <div className="space-y-2">
      <label
        htmlFor={selectId}
        className="block text-sm font-medium text-gray-700"
      >
        {name}
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value as EmailFrequency)}
        disabled={disabled}
        className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
        }`}
        aria-describedby={error ? errorId : undefined}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-2 text-sm text-red-600" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}
