import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CategoryToggle } from '@/components/ui/EmailPreferences/CategoryToggle';
import type { EmailFrequency } from '@/types/settings';

describe('CategoryToggle', () => {
  const defaultProps = {
    category: 'marketing',
    label: 'Marketing & Promotions',
    description: 'News about features and special offers',
    enabled: true,
    frequency: 'daily' as EmailFrequency,
    onEnabledChange: vi.fn(),
    onFrequencyChange: vi.fn()
  };

  it('should render with label and description', () => {
    render(<CategoryToggle {...defaultProps} />);
    expect(screen.getByText(defaultProps.label)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.description)).toBeInTheDocument();
  });

  it('should show enabled state correctly', () => {
    // Test enabled state
    render(<CategoryToggle {...defaultProps} enabled={true} />);
    const enabledCheckbox = screen.getByRole('checkbox', {
      name: defaultProps.label
    }) as HTMLInputElement;
    expect(enabledCheckbox.checked).toBe(true);

    // Clear and rerender
    cleanup();

    // Test disabled state
    render(<CategoryToggle {...defaultProps} enabled={false} />);
    const disabledCheckbox = screen.getByRole('checkbox', {
      name: defaultProps.label
    }) as HTMLInputElement;
    expect(disabledCheckbox.checked).toBe(false);
  });

  it('should call onEnabledChange when clicked', () => {
    const onEnabledChange = vi.fn();
    render(
      <CategoryToggle {...defaultProps} onEnabledChange={onEnabledChange} />
    );

    fireEvent.click(
      screen.getByRole('checkbox', {
        name: defaultProps.label
      })
    );
    expect(onEnabledChange).toHaveBeenCalledWith(false);
  });

  it('should show frequency select when enabled', () => {
    render(<CategoryToggle {...defaultProps} />);
    expect(screen.getByText('Daily Digest')).toBeInTheDocument();
  });

  it('should hide frequency select when disabled', () => {
    render(<CategoryToggle {...defaultProps} enabled={false} />);
    expect(screen.queryByText('Daily Digest')).not.toBeInTheDocument();
  });

  it('should call onFrequencyChange when frequency is changed', () => {
    const onFrequencyChange = vi.fn();
    render(
      <CategoryToggle {...defaultProps} onFrequencyChange={onFrequencyChange} />
    );

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'weekly' }
    });

    expect(onFrequencyChange).toHaveBeenCalledWith('weekly');
  });

  it('should show error messages when provided', () => {
    const error = {
      enabled: 'Enable is required',
      frequency: 'Frequency is required'
    };
    render(<CategoryToggle {...defaultProps} error={error} />);

    expect(screen.getByText(error.enabled)).toBeInTheDocument();
    expect(screen.getByText(error.frequency)).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<CategoryToggle {...defaultProps} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('id', `category-${defaultProps.category}`);
    expect(checkbox).toHaveAttribute(
      'aria-describedby',
      `${defaultProps.category}-description`
    );
  });
});
