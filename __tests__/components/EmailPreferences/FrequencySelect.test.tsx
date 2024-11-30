import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FrequencySelect } from '@/components/ui/EmailPreferences/FrequencySelect';
import type { EmailFrequency } from '@/types/settings';

describe('FrequencySelect', () => {
  const defaultProps = {
    name: 'test-frequency',
    value: 'daily' as EmailFrequency,
    onChange: vi.fn(),
    disabled: false
  };

  it('should render all frequency options', () => {
    render(<FrequencySelect {...defaultProps} />);

    expect(screen.getByText('Immediately')).toBeInTheDocument();
    expect(screen.getByText('Daily Digest')).toBeInTheDocument();
    expect(screen.getByText('Weekly Digest')).toBeInTheDocument();
    expect(screen.getByText('Never')).toBeInTheDocument();
  });

  it('should show selected value', () => {
    render(<FrequencySelect {...defaultProps} value="weekly" />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('weekly');
  });

  it('should call onChange when value changes', () => {
    const onChange = vi.fn();
    render(<FrequencySelect {...defaultProps} onChange={onChange} />);

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'weekly' }
    });

    expect(onChange).toHaveBeenCalledWith('weekly');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<FrequencySelect {...defaultProps} disabled={true} />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select).toBeDisabled();
  });

  it('should show error message when provided', () => {
    const error = 'This field is required';
    render(<FrequencySelect {...defaultProps} error={error} />);

    expect(screen.getByText(error)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-describedby',
      `frequency-${defaultProps.name}-error`
    );
  });

  it('should have proper accessibility attributes', () => {
    const error = 'This field is required';
    render(<FrequencySelect {...defaultProps} error={error} />);

    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('id', `frequency-${defaultProps.name}`);
    expect(select).toHaveAttribute(
      'aria-describedby',
      `frequency-${defaultProps.name}-error`
    );
  });
});
