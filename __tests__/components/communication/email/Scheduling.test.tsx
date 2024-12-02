import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { addDays, addHours, parseISO, isSameDay } from 'date-fns';
import Scheduling from '@/components/communication/email/Scheduling';

describe('Scheduling Component', () => {
  const mockOnScheduleChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Core functionality tests
  describe('Core Functionality', () => {
    it('should render without scheduled date', () => {
      render(
        <Scheduling
          scheduledFor={null}
          onScheduleChange={mockOnScheduleChange}
        />
      );

      expect(screen.getByText('Schedule Send')).toBeInTheDocument();
      expect(screen.getByText('Tomorrow')).toBeInTheDocument();
      expect(screen.queryByText(/Scheduled for/)).not.toBeInTheDocument();
    });

    it('should render with scheduled date', () => {
      // Set date to tomorrow at noon to avoid validation issues
      const futureDate = addHours(addDays(new Date(), 1), 12);
      render(
        <Scheduling
          scheduledFor={futureDate.toISOString()}
          onScheduleChange={mockOnScheduleChange}
        />
      );

      // Look for the scheduled time message
      expect(
        screen.getByText((content) => {
          return content.includes('Scheduled for');
        })
      ).toBeInTheDocument();
    });

    it('should handle quick select options', () => {
      render(
        <Scheduling
          scheduledFor={null}
          onScheduleChange={mockOnScheduleChange}
        />
      );

      fireEvent.click(screen.getByText('Tomorrow'));

      expect(mockOnScheduleChange).toHaveBeenCalledWith(expect.any(Date));
    });
  });

  // Validation tests
  describe('Validation', () => {
    it('should prevent scheduling in the past', () => {
      const pastDate = addDays(new Date(), -1);
      render(
        <Scheduling
          scheduledFor={pastDate.toISOString()}
          onScheduleChange={mockOnScheduleChange}
        />
      );

      // Should reset the date
      expect(mockOnScheduleChange).toHaveBeenCalledWith(null);
    });

    it('should allow scheduling in the future', () => {
      // Set date to tomorrow at noon to avoid validation issues
      const futureDate = addHours(addDays(new Date(), 1), 12);
      render(
        <Scheduling
          scheduledFor={futureDate.toISOString()}
          onScheduleChange={mockOnScheduleChange}
        />
      );

      // Look for the scheduled time message
      const scheduledText = screen.getByText((content) => {
        return content.includes('Scheduled for');
      });
      expect(scheduledText).toBeInTheDocument();

      // Check the datetime attribute
      const dateTimeElement = scheduledText
        .closest('div')
        ?.querySelector('time');
      expect(dateTimeElement).toBeInTheDocument();

      const dateTimeValue = dateTimeElement?.getAttribute('datetime');
      expect(dateTimeValue).toBeTruthy();
      expect(isSameDay(parseISO(dateTimeValue!), futureDate)).toBe(true);
    });
  });

  // Disabled state tests
  describe('Disabled State', () => {
    it('should disable all controls when disabled prop is true', () => {
      render(
        <Scheduling
          scheduledFor={null}
          onScheduleChange={mockOnScheduleChange}
          disabled={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });
});
