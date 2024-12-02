import { useState, useEffect } from 'react';
import { Calendar, Clock, X, AlertCircle } from 'lucide-react';
import {
  format,
  addDays,
  setHours,
  setMinutes,
  isAfter,
  addMinutes,
  isBefore,
  parseISO
} from 'date-fns';
import { SchedulingProps } from './types';

/**
 * Scheduling component for email scheduling
 * Allows users to schedule emails for future delivery
 * Includes validation and time zone handling
 */
const Scheduling = ({
  scheduledFor,
  onScheduleChange,
  disabled = false
}: SchedulingProps) => {
  // Initialize state with existing date or null
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    scheduledFor ? parseISO(scheduledFor) : null
  );

  // Time selection state (24-hour format)
  const [selectedTime, setSelectedTime] = useState<string>(
    scheduledFor ? format(parseISO(scheduledFor), 'HH:mm') : '09:00'
  );

  // Validation state
  const [validationError, setValidationError] = useState<string | null>(null);

  // Get user's timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Quick select options for dates
  const quickSelectDates = [
    { label: 'Tomorrow', value: addDays(new Date(), 1) },
    { label: 'Next Week', value: addDays(new Date(), 7) },
    { label: 'Next Month', value: addDays(new Date(), 30) }
  ];

  // Common business hours for time selection
  const commonTimes = [
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00'
  ];

  /**
   * Validates the selected date and time
   * @param date The date to validate
   * @param time The time to validate
   * @returns true if valid, false otherwise
   */
  const validateDateTime = (date: Date | null, time: string): boolean => {
    if (!date) return true; // No validation needed if no date selected

    const [hours, minutes] = time.split(':').map(Number);
    const dateWithTime = setMinutes(setHours(date, hours), minutes);
    const minimumTime = addMinutes(new Date(), 5); // Must be at least 5 minutes in the future

    if (isBefore(dateWithTime, minimumTime)) {
      setValidationError(
        'Schedule time must be at least 5 minutes in the future'
      );
      return false;
    }

    setValidationError(null);
    return true;
  };

  // Update parent component when date or time changes
  useEffect(() => {
    if (selectedDate) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const dateWithTime = setMinutes(setHours(selectedDate, hours), minutes);

      if (validateDateTime(selectedDate, selectedTime)) {
        onScheduleChange(dateWithTime);
      } else {
        onScheduleChange(null);
      }
    } else {
      setValidationError(null);
      onScheduleChange(null);
    }
  }, [selectedDate, selectedTime, onScheduleChange]);

  // Handle quick select date
  const handleQuickSelect = (date: Date) => {
    if (!disabled) {
      setSelectedDate(date);
      validateDateTime(date, selectedTime);
    }
  };

  // Handle time selection
  const handleTimeSelect = (time: string) => {
    if (!disabled) {
      setSelectedTime(time);
      validateDateTime(selectedDate, time);
    }
  };

  // Clear selected date/time
  const handleClear = () => {
    if (!disabled) {
      setSelectedDate(null);
      setSelectedTime('09:00');
      setValidationError(null);
      onScheduleChange(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with timezone info */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Schedule Send
        </label>
        <span className="text-xs text-gray-500">Timezone: {userTimezone}</span>
      </div>

      {/* Date Selection */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {quickSelectDates.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => handleQuickSelect(option.value)}
              disabled={disabled}
              className={`
                inline-flex items-center px-3 py-1.5 rounded-md text-sm
                ${
                  selectedDate &&
                  format(selectedDate, 'yyyy-MM-dd') ===
                    format(option.value, 'yyyy-MM-dd')
                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                border
              `}
            >
              {option.label}
            </button>
          ))}
          <input
            type="date"
            value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
            onChange={(e) => {
              const newDate = e.target.value ? new Date(e.target.value) : null;
              setSelectedDate(newDate);
              if (newDate) validateDateTime(newDate, selectedTime);
            }}
            min={format(new Date(), 'yyyy-MM-dd')}
            disabled={disabled}
            className={`
              px-3 py-1.5 rounded-md text-sm border
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            `}
          />
        </div>
      </div>

      {/* Time Selection */}
      {selectedDate && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Select Time
          </label>
          <div className="flex flex-wrap gap-2">
            {commonTimes.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => handleTimeSelect(time)}
                disabled={disabled}
                className={`
                  inline-flex items-center px-3 py-1.5 rounded-md text-sm
                  ${
                    time === selectedTime
                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  border
                `}
              >
                {format(
                  setHours(new Date(), parseInt(time.split(':')[0])),
                  'h:mm a'
                )}
              </button>
            ))}
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => handleTimeSelect(e.target.value)}
              disabled={disabled}
              className={`
                px-3 py-1.5 rounded-md text-sm border
                ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              `}
            />
          </div>
        </div>
      )}

      {/* Validation Error */}
      {validationError && (
        <div className="flex items-center space-x-2 text-amber-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Selected Schedule Display */}
      {selectedDate && !validationError && (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
          <div className="flex items-center space-x-2 text-blue-700">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">
              Scheduled for{' '}
              <time dateTime={format(selectedDate, "yyyy-MM-dd'T'HH:mm:ssxxx")}>
                {format(selectedDate, 'MMM d, yyyy')} at{' '}
                {format(
                  setHours(
                    setMinutes(
                      new Date(),
                      parseInt(selectedTime.split(':')[1])
                    ),
                    parseInt(selectedTime.split(':')[0])
                  ),
                  'h:mm a'
                )}
              </time>
            </span>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-blue-600 hover:text-blue-800"
              aria-label="Clear scheduled time"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Scheduling;
