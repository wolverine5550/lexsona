import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';

// Create hoisted mock functions that can be used in module scope
const mockSend = vi.hoisted(() => vi.fn());
const mockSupabaseQuery = vi.hoisted(() => vi.fn());

// Mock Resend
vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = { send: mockSend };
  }
}));

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      const query = {
        select: (queryStr: string) => {
          return {
            eq: (field: string, value: string) => {
              return {
                not: () => mockSupabaseQuery()
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

// After all mocks are set up, import the handler and types
import handler from '@/pages/api/emails/scheduled';
import { EmailDraft } from '@/components/communication/email/types';

// Mock scheduled draft data
const mockScheduledDraft: EmailDraft = {
  id: 'draft-123',
  subject: 'Scheduled Email',
  content: '<p>Test content</p>',
  recipient_email: 'test@example.com',
  recipient_name: 'Test User',
  template_id: null,
  scheduled_for: new Date(Date.now() - 1000).toISOString(), // Scheduled for 1 second ago
  status: 'scheduled',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'user-1',
  last_modified_by: 'user-1',
  metadata: null,
  attachments: []
};

describe('Scheduled Emails API', () => {
  const CRON_SECRET = 'test-cron-secret';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = CRON_SECRET;
    process.env.EMAIL_FROM_ADDRESS = 'test@example.com';
    process.env.EMAIL_REPLY_TO_ADDRESS = 'reply@example.com';

    mockSend.mockResolvedValue({
      data: { id: 'email-123' },
      error: null
    });

    mockSupabaseQuery.mockReturnValue({
      data: [mockScheduledDraft],
      error: null
    });
  });

  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET'
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
  });

  it('should return 401 without proper authorization', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      headers: {
        authorization: 'Bearer wrong-secret'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
  });

  it('should process scheduled emails successfully', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      headers: {
        authorization: `Bearer ${CRON_SECRET}`
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data).toEqual(
      expect.objectContaining({
        message: 'Scheduled emails processed',
        stats: expect.objectContaining({
          succeeded: expect.any(Number),
          failed: expect.any(Number),
          skipped: expect.any(Number)
        })
      })
    );
  });

  it('should handle database errors gracefully', async () => {
    mockSupabaseQuery.mockReturnValueOnce({
      data: null,
      error: new Error('Database error')
    });

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      headers: {
        authorization: `Bearer ${CRON_SECRET}`
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Failed to process scheduled emails'
    });
  });

  it('should skip emails not yet due', async () => {
    const futureDraft = {
      ...mockScheduledDraft,
      scheduled_for: new Date(Date.now() + 3600000).toISOString() // 1 hour in future
    };

    mockSupabaseQuery.mockReturnValueOnce({
      data: [futureDraft],
      error: null
    });

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      headers: {
        authorization: `Bearer ${CRON_SECRET}`
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.stats.skipped).toBeGreaterThan(0);
    expect(data.stats.succeeded).toBe(0);
  });
});
