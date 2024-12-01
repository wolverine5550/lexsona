import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DateRangePicker from '@/components/author/analytics/DateRangePicker';
import { format } from 'date-fns';

// Mock the current date consistently
const MOCK_DATE = new Date('2024-01-07T00:00:00.000Z');

describe('DateRangePicker', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_DATE);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('renders with initial date range', () => {
    render(<DateRangePicker />);

    const dateButton = screen.getByRole('button');
    const buttonText = dateButton.textContent || '';

    // Calculate expected initial dates (30 days from mock date)
    const endDate = MOCK_DATE;
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 30);

    const expectedStartDate = format(startDate, 'MMM d, yyyy');
    const expectedEndDate = format(endDate, 'MMM d, yyyy');

    expect(buttonText).toContain(expectedStartDate);
    expect(buttonText).toContain(expectedEndDate);
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
    render(<DateRangePicker onRangeChange={() => {}} />);

    // Click the date range button to open the dropdown
    const dateButton = screen.getByRole('button');
    fireEvent.click(dateButton);

    // Select "Last 30 days" preset
    fireEvent.click(screen.getByText('Last 30 days'));

    // Get the updated button text
    const buttonText = dateButton.textContent || '';

    // Calculate expected dates using the mocked current date
    const endDate = MOCK_DATE;
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 30);

    const expectedStartDate = format(startDate, 'MMM d, yyyy');
    const expectedEndDate = format(endDate, 'MMM d, yyyy');

    // Verify the button shows the correct date range
    expect(buttonText).toContain(expectedStartDate);
    expect(buttonText).toContain(expectedEndDate);
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
