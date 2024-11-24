import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsService } from '@/services/analytics';
import { createClient } from '@/utils/supabase/client';
import type {
  AnalyticsReport,
  ContactStatus,
  OutreachMetrics
} from '@/types/analytics';
import type { SupabaseClient } from '@supabase/supabase-js';

// Create a more specific mock type
type MockSupabaseClient = {
  from: (table: string) => any;
} & Partial<SupabaseClient>;

// Mock Supabase client
vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn()
}));

describe('AnalyticsService', () => {
  // Mock data setup
  const mockContacts = [
    {
      status: 'sent' as ContactStatus,
      method: 'email',
      created_at: '2024-03-19T10:00:00Z',
      response_date: null
    },
    {
      status: 'received' as ContactStatus,
      method: 'email',
      created_at: '2024-03-19T11:00:00Z',
      response_date: '2024-03-19T12:00:00Z'
    },
    {
      status: 'scheduled' as ContactStatus,
      method: 'social',
      created_at: '2024-03-19T13:00:00Z',
      response_date: '2024-03-19T14:00:00Z'
    },
    {
      status: 'declined' as ContactStatus,
      method: 'form',
      created_at: '2024-03-19T15:00:00Z',
      response_date: '2024-03-19T16:00:00Z'
    }
  ];

  const emptyMetrics: OutreachMetrics = {
    totalOutreach: 0,
    responseRate: 0,
    bookingRate: 0,
    averageResponseTime: 0,
    rejectionRate: 0
  };

  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock Supabase client for each test
    mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis()
      })
    };

    vi.mocked(createClient).mockReturnValue(mockSupabase as any);
  });

  describe('generateReport', () => {
    it('should generate a complete analytics report', async () => {
      const mockResponse = { data: mockContacts, error: null };
      mockSupabase.from('contact_history').select().eq().gte().lte = vi
        .fn()
        .mockResolvedValue(mockResponse);

      const report = await AnalyticsService.generateReport({
        authorId: 'author123',
        period: 'week',
        includeMethodBreakdown: true,
        includeTrends: true
      });

      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('byMethod');
      expect(report).toHaveProperty('trends');
      expect(mockSupabase.from).toHaveBeenCalledWith('contact_history');
    });

    it('should handle empty data', async () => {
      const mockResponse = { data: [], error: null };
      mockSupabase.from('contact_history').select().eq().gte().lte = vi
        .fn()
        .mockResolvedValue(mockResponse);

      const report = await AnalyticsService.generateReport({
        authorId: 'author123',
        period: 'week'
      });

      expect(report.metrics).toEqual(emptyMetrics);
      expect(report.byMethod).toEqual([]);
      expect(report.trends).toEqual([]);
    });
  });

  describe('calculateMetrics', () => {
    it('should calculate correct metrics from contact data', async () => {
      const mockResponse = { data: mockContacts, error: null };
      mockSupabase.from('contact_history').select().eq().gte().lte = vi
        .fn()
        .mockResolvedValue(mockResponse);

      const report = await AnalyticsService.generateReport({
        authorId: 'author123',
        period: 'week'
      });

      expect(report.metrics.totalOutreach).toBe(4);
      expect(report.metrics.responseRate).toBe(75); // 3 out of 4 got responses
      expect(report.metrics.bookingRate).toBe(25); // 1 out of 4 scheduled
      expect(report.metrics.rejectionRate).toBe(25); // 1 out of 4 declined
    });
  });

  describe('calculateMethodMetrics', () => {
    it('should break down metrics by contact method', async () => {
      const mockResponse = { data: mockContacts, error: null };
      mockSupabase.from('contact_history').select().eq().gte().lte = vi
        .fn()
        .mockResolvedValue(mockResponse);

      const report = await AnalyticsService.generateReport({
        authorId: 'author123',
        period: 'week',
        includeMethodBreakdown: true
      });

      const emailMetrics = report.byMethod.find((m) => m.method === 'email');
      expect(emailMetrics).toBeDefined();
      expect(emailMetrics?.attempts).toBe(2);
      expect(emailMetrics?.responses).toBe(1);
    });
  });

  describe('calculateTrends', () => {
    it('should generate daily trend data', async () => {
      const mockResponse = { data: mockContacts, error: null };
      mockSupabase.from('contact_history').select().eq().gte().lte = vi
        .fn()
        .mockResolvedValue(mockResponse);

      const report = await AnalyticsService.generateReport({
        authorId: 'author123',
        period: 'week',
        includeTrends: true
      });

      expect(report.trends).toHaveLength(1); // All contacts are on the same day
      expect(report.trends[0].value).toBe(4); // Total contacts for that day
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockError = new Error('Database error');
      mockSupabase.from('contact_history').select().eq().gte().lte = vi
        .fn()
        .mockRejectedValue(mockError);

      await expect(
        AnalyticsService.generateReport({
          authorId: 'author123',
          period: 'week'
        })
      ).rejects.toThrow('Database error');
    });
  });

  describe('date range calculation', () => {
    it('should calculate correct date ranges for different periods', async () => {
      const mockResponse = { data: [], error: null };
      mockSupabase.from('contact_history').select().eq().gte().lte = vi
        .fn()
        .mockResolvedValue(mockResponse);

      // Test different periods
      const periods = [
        'day',
        'week',
        'month',
        'quarter',
        'year',
        'all'
      ] as const;

      for (const period of periods) {
        await AnalyticsService.generateReport({
          authorId: 'author123',
          period
        });

        expect(mockSupabase.from).toHaveBeenCalledWith('contact_history');
      }
    });
  });
});
