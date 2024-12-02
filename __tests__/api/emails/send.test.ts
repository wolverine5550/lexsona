import { vi, describe, it, expect, beforeEach } from 'vitest';
import '../../setup';
import '../../setup/supabase';
import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '@/pages/api/emails/send';
import { createClient } from '@/utils/supabase/client';

// Create hoisted mock functions that can be used in module scope
const mockSend = vi.hoisted(() => vi.fn());
const mockSupabaseClient = vi.hoisted(() => vi.fn());

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      const query = {
        select: (queryStr: string) => {
          return {
            eq: (field: string, value: string) => {
              return {
                single: () => {
                  if (value === 'draft-123') {
                    return Promise.resolve({
                      data: {
                        id: 'draft-123',
                        subject: 'Test Subject',
                        content: 'Test Body',
                        recipient_email: 'test@example.com',
                        recipient_name: 'Test User',
                        status: 'draft',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        metadata: null,
                        attachments: []
                      },
                      error: null
                    });
                  } else {
                    return Promise.resolve({
                      data: null,
                      error: null
                    });
                  }
                }
              };
            }
          };
        },
        update: (data: any) => ({
          eq: (field: string, value: string) => Promise.resolve({ error: null })
        })
      };
      return query;
    },
    storage: {
      from: () => ({
        getPublicUrl: () => ({
          data: { publicUrl: 'https://example.com/file' }
        })
      })
    }
  })
}));

// Mock Resend module
vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = { send: mockSend };
  }
}));

describe('Email Send API', () => {
  // Mock fetch globally
  global.fetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockSend.mockResolvedValue({
      data: { id: 'email-123' },
      error: null
    });

    // Set required environment variables
    process.env.EMAIL_FROM_ADDRESS = 'test@example.com';
    process.env.EMAIL_REPLY_TO_ADDRESS = 'reply@example.com';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET'
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
  });

  it('should send email successfully', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        draftId: 'draft-123'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        message: 'Email sent successfully'
      })
    );
  });

  it('should handle missing draft', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        draftId: 'non-existent'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(404);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Draft not found'
    });
  });

  it('should handle send failure', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        draftId: 'draft-123'
      }
    });

    // Mock the send failure for this test
    mockSend.mockRejectedValueOnce(new Error('Send failed'));

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Failed to send email'
    });
  });
});
