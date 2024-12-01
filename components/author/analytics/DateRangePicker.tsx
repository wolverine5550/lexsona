import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface DateRangePickerProps {
  onRangeChange?: (startDate: Date, endDate: Date) => void;
}

const presetRanges = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Last Year', days: 365 }
];

const DateRangePicker = ({ onRangeChange }: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date()
  });

  const handlePresetClick = (days: number) => {
    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    setDateRange({ startDate, endDate });
    setIsOpen(false);
    onRangeChange?.(startDate, endDate);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
      >
        <Calendar className="w-4 h-4 text-gray-600" />
        <span className="text-sm text-gray-700">
          {format(dateRange.startDate, 'MMM d, yyyy')} -{' '}
          {format(dateRange.endDate, 'MMM d, yyyy')}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border p-4 z-10">
          <div className="space-y-2">
            {presetRanges.map((range) => (
              <button
                key={range.days}
                onClick={() => handlePresetClick(range.days)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                {range.label}
              </button>
            ))}
          </div>

          <div className="border-t mt-4 pt-4">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Apply Range
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
