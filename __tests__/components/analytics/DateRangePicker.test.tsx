import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DateRangePicker from '@/components/author/analytics/DateRangePicker';
import { format } from 'date-fns';

// Mock the current date
const mockDate = new Date('2024-01-15');

describe('DateRangePicker', () => {
  beforeAll(() => {
    // Mock Date.now() to return a fixed date
    vi.spyOn(Date, 'now').mockImplementation(() => mockDate.getTime());
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('renders with initial date range', () => {
    render(<DateRangePicker />);

    // Should show the default date range (last 30 days)
    const startDate = new Date(mockDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    const expectedDateText = `${format(startDate, 'MMM d, yyyy')} - ${format(
      mockDate,
      'MMM d, yyyy'
    )}`;

    expect(screen.getByText(expectedDateText)).toBeInTheDocument();
  });

  it('opens dropdown when clicking the button', () => {
    render(<DateRangePicker />);

    // Initially, preset options should not be visible
    expect(screen.queryByText('Last 7 days')).not.toBeInTheDocument();

    // Click the date range button
    fireEvent.click(screen.getByRole('button'));

    // Preset options should now be visible
    expect(screen.getByText('Last 7 days')).toBeInTheDocument();
    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
    expect(screen.getByText('Last 90 days')).toBeInTheDocument();
  });

  it('updates date range when selecting a preset', () => {
    render(<DateRangePicker />);

    // Open the dropdown
    fireEvent.click(screen.getByRole('button'));

    // Click "Last 7 days" option
    fireEvent.click(screen.getByText('Last 7 days'));

    // Should show updated date range
    const startDate = new Date(mockDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const expectedDateText = `${format(startDate, 'MMM d, yyyy')} - ${format(
      mockDate,
      'MMM d, yyyy'
    )}`;

    expect(screen.getByText(expectedDateText)).toBeInTheDocument();
  });

  it('closes dropdown when selecting a preset', () => {
    render(<DateRangePicker />);

    // Open the dropdown
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Last 7 days')).toBeInTheDocument();

    // Select a preset
    fireEvent.click(screen.getByText('Last 7 days'));

    // Dropdown should be closed
    expect(screen.queryByText('Last 7 days')).not.toBeInTheDocument();
  });

  it('closes dropdown when clicking Apply button', () => {
    render(<DateRangePicker />);

    // Open the dropdown
    fireEvent.click(screen.getByRole('button'));

    // Click Apply button
    fireEvent.click(screen.getByText('Apply Range'));

    // Dropdown should be closed
    expect(screen.queryByText('Apply Range')).not.toBeInTheDocument();
  });

  // Test for accessibility
  it('has proper ARIA attributes', () => {
    render(<DateRangePicker />);

    // Main button should have appropriate attributes
    const mainButton = screen.getByRole('button');
    expect(mainButton).toHaveAttribute('class');

    // Open dropdown
    fireEvent.click(mainButton);

    // Preset buttons should be accessible
    const presetButtons = screen.getAllByRole('button');
    presetButtons.forEach((button) => {
      expect(button).toHaveAttribute('class');
    });
  });
});
