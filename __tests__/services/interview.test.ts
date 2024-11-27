import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { InterviewServiceImpl } from '@/services/dashboard/interview';
import type { Database } from '@/types/database';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn()
}));

// Define mock Supabase client type
type MockSupabaseClient = {
  [K in keyof SupabaseClient<Database>]: ReturnType<typeof vi.fn>;
} & {
  from: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  channel: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
};

describe('InterviewServiceImpl', () => {
  let service: InterviewServiceImpl;
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    // Setup mock responses
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      channel: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis()
    } as MockSupabaseClient;

    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);
    service = new InterviewServiceImpl(
      mockSupabase as unknown as SupabaseClient<Database>
    );
  });

  describe('getUpcomingInterviews', () => {
    it('should fetch upcoming interviews successfully', async () => {
      const mockInterviews = [
        {
          id: '1',
          author_id: 'author1',
          podcast_id: 'pod1',
          scheduled_date: '2024-01-01',
          scheduled_time: '10:00:00',
          duration: 60,
          status: 'scheduled',
          notes: 'Test notes',
          meeting_link: 'https://meet.test',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          podcast: {
            id: 'pod1',
            title: 'Test Podcast',
            publisher: 'Test Publisher'
          }
        }
      ];

      mockSupabase.select.mockResolvedValue({
        data: mockInterviews,
        error: null
      });

      const result = await service.getUpcomingInterviews('author1');

      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('interviews');
      expect(mockSupabase.eq).toHaveBeenCalledWith('author_id', 'author1');
      expect(mockSupabase.gte).toHaveBeenCalled(); // Check date filter
    });

    it('should handle errors gracefully', async () => {
      mockSupabase.select.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      });

      const result = await service.getUpcomingInterviews('author1');

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('FETCH_INTERVIEWS_ERROR');
    });

    it('should apply status filter when provided', async () => {
      mockSupabase.select.mockResolvedValue({
        data: [],
        error: null
      });

      await service.getUpcomingInterviews('author1', 'scheduled');

      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'scheduled');
    });
  });

  describe('scheduleInterview', () => {
    const mockInterviewData = {
      author_id: 'author1',
      podcast_id: 'pod1',
      scheduled_date: '2024-01-01',
      scheduled_time: '10:00:00',
      duration: 60,
      status: 'scheduled' as const
    };

    it('should schedule interview and create activity successfully', async () => {
      const mockCreatedInterview = {
        ...mockInterviewData,
        id: '1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockSupabase.single.mockResolvedValue({
        data: mockCreatedInterview,
        error: null
      });

      mockSupabase.insert.mockResolvedValue({ error: null }); // For activity

      const result = await service.scheduleInterview(mockInterviewData);

      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('interviews');
      expect(mockSupabase.insert).toHaveBeenCalledWith([mockInterviewData]);
    });

    it('should handle scheduling errors', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Scheduling failed')
      });

      const result = await service.scheduleInterview(mockInterviewData);

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('SCHEDULE_INTERVIEW_ERROR');
    });
  });

  describe('updateInterview', () => {
    it('should update interview and create activity successfully', async () => {
      mockSupabase.update.mockResolvedValue({ error: null });
      mockSupabase.insert.mockResolvedValue({ error: null }); // For activity

      const result = await service.updateInterview('interview1', {
        status: 'completed'
      });

      expect(result.error).toBeUndefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('interviews');
      expect(mockSupabase.update).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'interview1');
    });

    it('should handle update errors', async () => {
      mockSupabase.update.mockResolvedValue({
        error: new Error('Update failed')
      });

      const result = await service.updateInterview('interview1', {
        status: 'completed'
      });

      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('UPDATE_INTERVIEW_ERROR');
    });
  });

  describe('subscribeToInterviews', () => {
    it('should set up subscription correctly', () => {
      const mockCallback = vi.fn();
      const unsubscribe = service.subscribeToInterviews(
        'author1',
        mockCallback
      );

      expect(mockSupabase.channel).toHaveBeenCalledWith('interviews:author1');
      expect(mockSupabase.on).toHaveBeenCalled();
      expect(mockSupabase.subscribe).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });

    it('should handle subscription cleanup', () => {
      const mockUnsubscribe = vi.fn();
      mockSupabase.subscribe.mockReturnValue({
        unsubscribe: mockUnsubscribe
      });

      const unsubscribe = service.subscribeToInterviews('author1', vi.fn());
      unsubscribe();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});
