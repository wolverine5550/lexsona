'use client';

import { type EmailCategory, type EmailFrequency } from '@/types/settings';
import { FrequencySelect } from './FrequencySelect';

interface CategoryToggleProps {
  category: EmailCategory;
  label: string;
  description: string;
  enabled: boolean;
  frequency: EmailFrequency;
  onEnabledChange: (enabled: boolean) => void;
  onFrequencyChange: (frequency: EmailFrequency) => void;
  error?: {
    enabled?: string;
    frequency?: string;
  };
}

/**
 * Category toggle component for email preferences
 * Combines a toggle switch with frequency selection for each email category
 */
export function CategoryToggle({
  category,
  label,
  description,
  enabled,
  frequency,
  onEnabledChange,
  onFrequencyChange,
  error
}: CategoryToggleProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start space-x-3">
        {/* Category Toggle */}
        <div className="flex items-center h-5">
          <input
            id={`category-${category}`}
            type="checkbox"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            aria-describedby={`${category}-description`}
          />
        </div>
        <div className="flex-1">
          <label
            htmlFor={`category-${category}`}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
          <p id={`${category}-description`} className="text-sm text-gray-500">
            {description}
          </p>
          {error?.enabled && (
            <p className="mt-1 text-sm text-red-600">{error.enabled}</p>
          )}
        </div>
      </div>

      {/* Frequency Selection */}
      {enabled && (
        <div className="ml-8">
          <FrequencySelect
            name={`frequency-${category}`}
            value={frequency}
            onChange={onFrequencyChange}
            error={error?.frequency}
          />
        </div>
      )}
    </div>
  );
}
