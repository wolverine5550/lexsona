import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContactHistoryService } from '@/services/contact-history';
import { createClient } from '@/utils/supabase/client';
import type {
  ContactAttempt,
  ContactMethod,
  ContactStatus,
  EmailContactDetails,
  SocialContactDetails
} from '@/types/contact-history';
import type { SupabaseClient } from '@supabase/supabase-js';

// Create a more specific mock type
type MockSupabaseClient = {
  from: (table: string) => any;
} & Partial<SupabaseClient>;

// Mock Supabase client
vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn()
}));

describe('ContactHistoryService', () => {
  // Mock data setup
  const mockEmailDetails: EmailContactDetails = {
    emailAddress: 'host@podcast.com',
    subject: 'Book Interview Request',
    templateUsed: 'standard-pitch'
  };

  const mockSocialDetails: SocialContactDetails = {
    platform: 'twitter',
    profileUrl: 'https://twitter.com/podcasthost',
    messageUrl: 'https://twitter.com/messages/123'
  };

  const mockContact: ContactAttempt = {
    id: 'contact123',
    matchId: 'match123',
    authorId: 'author123',
    method: 'email' as ContactMethod,
    status: 'sent' as ContactStatus,
    content: 'Would love to discuss my book on your show',
    emailDetails: mockEmailDetails,
    requiresFollowUp: true,
    followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock Supabase client for each test
    mockSupabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis()
      })
    };

    vi.mocked(createClient).mockReturnValue(mockSupabase as any);
  });

  describe('recordContact', () => {
    it('should record an email contact attempt', async () => {
      const mockResponse = { data: mockContact, error: null };
      mockSupabase.from('contact_history').insert().select().single = vi
        .fn()
        .mockResolvedValue(mockResponse);

      const result = await ContactHistoryService.recordContact(
        mockContact.matchId,
        mockContact.authorId,
        'email',
        mockContact.content,
        mockEmailDetails
      );

      expect(result).toEqual(mockContact);
      expect(mockSupabase.from).toHaveBeenCalledWith('contact_history');
    });

    it('should record a social media contact attempt', async () => {
      const socialContact = {
        ...mockContact,
        method: 'social',
        socialDetails: mockSocialDetails
      };
      const mockResponse = { data: socialContact, error: null };
      mockSupabase.from('contact_history').insert().select().single = vi
        .fn()
        .mockResolvedValue(mockResponse);

      const result = await ContactHistoryService.recordContact(
        mockContact.matchId,
        mockContact.authorId,
        'social',
        mockContact.content,
        undefined,
        mockSocialDetails
      );

      expect(result).toEqual(socialContact);
    });

    it('should throw error if email details missing for email method', async () => {
      await expect(
        ContactHistoryService.recordContact(
          mockContact.matchId,
          mockContact.authorId,
          'email',
          mockContact.content
        )
      ).rejects.toThrow('Email address is required for email contact method');
    });
  });

  describe('updateStatus', () => {
    it('should update contact status with response', async () => {
      const updatedContact = {
        ...mockContact,
        status: 'received',
        responseReceived: 'Interested in booking',
        responseDate: new Date()
      };
      const mockResponse = { data: updatedContact, error: null };
      mockSupabase.from('contact_history').update().eq().select().single = vi
        .fn()
        .mockResolvedValue(mockResponse);

      const result = await ContactHistoryService.updateStatus(
        mockContact.id,
        'received',
        'Interested in booking'
      );

      expect(result).toEqual(updatedContact);
      expect(result.status).toBe('received');
      expect(result.responseReceived).toBe('Interested in booking');
    });

    it('should handle declined status', async () => {
      const declinedContact = {
        ...mockContact,
        status: 'declined',
        requiresFollowUp: false
      };
      const mockResponse = { data: declinedContact, error: null };
      mockSupabase.from('contact_history').update().eq().select().single = vi
        .fn()
        .mockResolvedValue(mockResponse);

      const result = await ContactHistoryService.updateStatus(
        mockContact.id,
        'declined'
      );

      expect(result.status).toBe('declined');
      expect(result.requiresFollowUp).toBe(false);
    });
  });

  describe('updateFollowUp', () => {
    it('should update follow-up details', async () => {
      const followUpDate = new Date();
      const updatedContact = {
        ...mockContact,
        requiresFollowUp: true,
        followUpDate,
        followUpNote: 'Send reminder'
      };
      const mockResponse = { data: updatedContact, error: null };
      mockSupabase.from('contact_history').update().eq().select().single = vi
        .fn()
        .mockResolvedValue(mockResponse);

      const result = await ContactHistoryService.updateFollowUp(
        mockContact.id,
        true,
        followUpDate,
        'Send reminder'
      );

      expect(result.requiresFollowUp).toBe(true);
      expect(result.followUpDate).toEqual(followUpDate);
      expect(result.followUpNote).toBe('Send reminder');
    });
  });

  describe('getContactHistory', () => {
    it('should fetch contact history with filters', async () => {
      const mockResponse = { data: [mockContact], error: null };
      mockSupabase.from('contact_history').select().eq().eq().order = vi
        .fn()
        .mockResolvedValue(mockResponse);

      const result = await ContactHistoryService.getContactHistory({
        matchId: mockContact.matchId,
        authorId: mockContact.authorId,
        method: 'email',
        requiresFollowUp: true
      });

      expect(result).toEqual([mockContact]);
      expect(mockSupabase.from).toHaveBeenCalledWith('contact_history');
    });
  });
});
