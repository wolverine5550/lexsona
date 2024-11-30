import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WebhookSection } from '@/components/ui/Integrations/WebhookSection';
import type {
  UseFormRegister,
  FieldErrors,
  UseFormWatch
} from 'react-hook-form';
import type { IntegrationSettingsFormData } from '@/types/settings';

describe('WebhookSection', () => {
  // Mock form register function
  const mockRegister = vi.fn((name: string) => ({
    name,
    onChange: vi.fn(),
    onBlur: vi.fn(),
    ref: vi.fn()
  })) as unknown as UseFormRegister<IntegrationSettingsFormData>;

  // Mock form watch function with proper typing
  const mockWatch = vi.fn().mockImplementation((path: string) => {
    if (path === 'webhooks.url') return 'https://test.com/webhook';
    if (path === 'webhooks.secret') return 'test-secret';
    if (path === 'webhooks.enabled') return true;
    return undefined;
  }) as unknown as UseFormWatch<IntegrationSettingsFormData>;

  // Mock test webhook function
  const mockTestWebhook = vi.fn();

  // Base props for the component
  const defaultProps = {
    register: mockRegister,
    errors: {} as FieldErrors<IntegrationSettingsFormData>,
    enabled: true,
    watch: mockWatch,
    onTest: mockTestWebhook
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render webhook configuration when enabled', () => {
    render(<WebhookSection {...defaultProps} />);

    // Check for main section elements
    expect(screen.getByText('Webhook Settings')).toBeInTheDocument();
    expect(screen.getByText(/Configure webhook endpoints/)).toBeInTheDocument();

    // Check for form fields
    expect(screen.getByLabelText(/webhook url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/webhook secret/i)).toBeInTheDocument();
    expect(screen.getByText(/events to send/i)).toBeInTheDocument();
  });

  it('should not render configuration when disabled', () => {
    render(<WebhookSection {...defaultProps} enabled={false} />);

    // Configuration should be hidden
    expect(screen.queryByLabelText(/webhook url/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/webhook secret/i)).not.toBeInTheDocument();
  });

  it('should display validation errors', () => {
    const errors = {
      webhooks: {
        url: { message: 'Invalid URL' },
        secret: { message: 'Secret is required' },
        events: { message: 'Select at least one event' }
      }
    } as FieldErrors<IntegrationSettingsFormData>;

    render(<WebhookSection {...defaultProps} errors={errors} />);

    // Check for error messages
    expect(screen.getByText('Invalid URL')).toBeInTheDocument();
    expect(screen.getByText('Secret is required')).toBeInTheDocument();
    expect(screen.getByText('Select at least one event')).toBeInTheDocument();
  });

  it('should handle webhook testing', () => {
    render(<WebhookSection {...defaultProps} />);

    // Click test button
    fireEvent.click(screen.getByText('Test Webhook'));

    // Verify test function was called with correct parameters
    expect(mockTestWebhook).toHaveBeenCalledWith(
      'https://test.com/webhook',
      'test-secret'
    );
  });

  it('should register all event checkboxes', () => {
    render(<WebhookSection {...defaultProps} />);

    // Check all event options are rendered
    const expectedEvents = [
      'User Created',
      'User Updated',
      'Interview Scheduled',
      'Interview Updated',
      'Review Posted'
    ];

    expectedEvents.forEach((eventLabel) => {
      expect(screen.getByLabelText(eventLabel)).toBeInTheDocument();
    });
  });

  it('should handle enable/disable toggle', () => {
    render(<WebhookSection {...defaultProps} />);

    // Toggle webhook enable/disable
    const toggle = screen.getByLabelText(/enable webhooks/i);
    fireEvent.click(toggle);

    // Verify register was called
    expect(mockRegister).toHaveBeenCalledWith('webhooks.enabled');
  });

  // Test accessibility
  it('should have proper accessibility attributes', () => {
    render(<WebhookSection {...defaultProps} />);

    // Check for proper labeling
    const urlInput = screen.getByLabelText(/webhook url/i);
    expect(urlInput).toHaveAttribute('id', 'webhook-url');
    expect(urlInput).toHaveAttribute('type', 'url');

    const secretInput = screen.getByLabelText(/webhook secret/i);
    expect(secretInput).toHaveAttribute('id', 'webhook-secret');
    expect(secretInput).toHaveAttribute('type', 'password');
  });
});
