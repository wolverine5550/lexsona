import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CategoryToggle } from '@/components/ui/EmailPreferences/CategoryToggle';
import type { EmailCategory } from '@/types/settings';

describe('CategoryToggle', () => {
  const defaultProps = {
    category: 'marketing' as EmailCategory,
    label: 'Marketing & Promotions',
    description: 'News about features and special offers',
    enabled: true,
    frequency: 'weekly' as const,
    onEnabledChange: vi.fn(),
    onFrequencyChange: vi.fn()
  };

  it('should render category information', () => {
    render(<CategoryToggle {...defaultProps} />);

    expect(screen.getByText(defaultProps.label)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.description)).toBeInTheDocument();
  });

  it('should show enabled state correctly', () => {
    render(<CategoryToggle {...defaultProps} />);

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);

    render(<CategoryToggle {...defaultProps} enabled={false} />);
    const disabledCheckbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(disabledCheckbox.checked).toBe(false);
  });

  it('should call onEnabledChange when toggled', () => {
    const onEnabledChange = vi.fn();
    render(
      <CategoryToggle {...defaultProps} onEnabledChange={onEnabledChange} />
    );

    fireEvent.click(screen.getByRole('checkbox'));
    expect(onEnabledChange).toHaveBeenCalledWith(false);
  });

  it('should show frequency select when enabled', () => {
    render(<CategoryToggle {...defaultProps} />);
    expect(screen.getByText('Weekly Digest')).toBeInTheDocument();
  });

  it('should hide frequency select when disabled', () => {
    render(<CategoryToggle {...defaultProps} enabled={false} />);
    expect(screen.queryByText('Weekly Digest')).not.toBeInTheDocument();
  });

  it('should call onFrequencyChange when frequency is changed', () => {
    const onFrequencyChange = vi.fn();
    render(
      <CategoryToggle {...defaultProps} onFrequencyChange={onFrequencyChange} />
    );

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'daily' }
    });

    expect(onFrequencyChange).toHaveBeenCalledWith('daily');
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
