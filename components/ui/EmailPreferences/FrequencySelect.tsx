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

  return (
    <div className="space-y-1">
      <select
        id={`frequency-${name}`}
        value={value}
        onChange={(e) => onChange(e.target.value as EmailFrequency)}
        disabled={disabled}
        className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md ${
          disabled ? 'bg-gray-100' : ''
        }`}
        aria-describedby={error ? `${name}-error` : undefined}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600" id={`${name}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
