import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { OAuthSection } from '@/components/ui/Integrations/OAuthSection';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { IntegrationSettingsFormData } from '@/types/settings';

describe('OAuthSection', () => {
  // Mock form register function
  const mockRegister = vi.fn((name: string) => ({
    name,
    onChange: vi.fn(),
    onBlur: vi.fn(),
    ref: vi.fn()
  })) as unknown as UseFormRegister<IntegrationSettingsFormData>;

  // Base props for the component
  const defaultProps = {
    register: mockRegister,
    errors: {} as FieldErrors<IntegrationSettingsFormData>
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all OAuth fields', () => {
    render(<OAuthSection {...defaultProps} />);

    // Check for section title and description
    expect(screen.getByText('OAuth Settings')).toBeInTheDocument();
    expect(
      screen.getByText(/Configure OAuth credentials/i)
    ).toBeInTheDocument();

    // Check for all required fields
    expect(screen.getByLabelText(/client id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/client secret/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/redirect uri/i)).toBeInTheDocument();
  });

  it('should display validation errors', () => {
    const errors = {
      oauth: {
        client_id: { message: 'Client ID is required' },
        client_secret: { message: 'Client Secret is required' },
        redirect_uri: { message: 'Invalid URI format' }
      }
    } as FieldErrors<IntegrationSettingsFormData>;

    render(<OAuthSection {...defaultProps} errors={errors} />);

    // Check for error messages
    expect(screen.getByText('Client ID is required')).toBeInTheDocument();
    expect(screen.getByText('Client Secret is required')).toBeInTheDocument();
    expect(screen.getByText('Invalid URI format')).toBeInTheDocument();
  });

  it('should register all form fields', () => {
    render(<OAuthSection {...defaultProps} />);

    // Verify register was called for each field
    expect(mockRegister).toHaveBeenCalledWith('oauth.client_id');
    expect(mockRegister).toHaveBeenCalledWith('oauth.client_secret');
    expect(mockRegister).toHaveBeenCalledWith('oauth.redirect_uri');
  });

  // Test accessibility
  it('should have proper accessibility attributes', () => {
    render(<OAuthSection {...defaultProps} />);

    // Check for proper input attributes
    const clientIdInput = screen.getByLabelText(/client id/i);
    expect(clientIdInput).toHaveAttribute('id', 'client-id');
    expect(clientIdInput).toHaveAttribute('type', 'text');

    const clientSecretInput = screen.getByLabelText(/client secret/i);
    expect(clientSecretInput).toHaveAttribute('id', 'client-secret');
    expect(clientSecretInput).toHaveAttribute('type', 'password');

    const redirectUriInput = screen.getByLabelText(/redirect uri/i);
    expect(redirectUriInput).toHaveAttribute('id', 'redirect-uri');
    expect(redirectUriInput).toHaveAttribute('type', 'url');
  });
});
