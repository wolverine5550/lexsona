/**
 * Utility type for JSON data in PostgreSQL
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Database interface representing our Supabase schema
 */
export interface Database {
  public: {
    Tables: {
      /**
       * Authors table - represents content creators/podcast guests
       */
      authors: {
        Row: {
          id: string; // UUID primary key
          name: string; // Author's full name
          email: string; // Unique email address
          bio: string | null; // Optional biography
          created_at: string; // Timestamp of creation
          updated_at: string; // Timestamp of last update
        };
        Insert: {
          id?: string; // Optional on insert (auto-generated)
          name: string;
          email: string;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      /**
       * Matches table - podcast matching recommendations
       */
      matches: {
        Row: {
          id: string;
          author_id: string; // References authors.id
          podcast_id: string; // References podcasts.id (text type)
          match_score: number; // Decimal between 0 and 1
          match_reason: string[]; // Array of reasons for the match
          status: Database['public']['Enums']['match_status'];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          podcast_id: string;
          match_score: number;
          match_reason?: string[];
          status?: Database['public']['Enums']['match_status'];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          podcast_id?: string;
          match_score?: number;
          match_reason?: string[];
          status?: Database['public']['Enums']['match_status'];
          created_at?: string;
          updated_at?: string;
        };
      };

      /**
       * Interviews table - scheduled podcast appearances
       */
      interviews: {
        Row: {
          id: string;
          author_id: string; // References authors.id
          podcast_id: string; // References podcasts.id
          scheduled_date: string; // DATE type
          scheduled_time: string; // TIME type
          duration: number; // Interview duration in minutes
          status: Database['public']['Enums']['interview_status'];
          notes: string | null;
          meeting_link: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          podcast_id: string;
          scheduled_date: string;
          scheduled_time: string;
          duration: number;
          status?: Database['public']['Enums']['interview_status'];
          notes?: string | null;
          meeting_link?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          podcast_id?: string;
          scheduled_date?: string;
          scheduled_time?: string;
          duration?: number;
          status?: Database['public']['Enums']['interview_status'];
          notes?: string | null;
          meeting_link?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      /**
       * Activities table - user activity feed
       */
      activities: {
        Row: {
          id: string;
          author_id: string;
          type: Database['public']['Enums']['activity_type'];
          title: string;
          description: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          type: Database['public']['Enums']['activity_type'];
          title: string;
          description: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          type?: Database['public']['Enums']['activity_type'];
          title?: string;
          description?: string;
          metadata?: Json | null;
          created_at?: string;
        };
      };

      /**
       * Notifications table - user notifications
       */
      notifications: {
        Row: {
          id: string;
          author_id: string;
          type: Database['public']['Enums']['activity_type'];
          title: string;
          description: string;
          read: boolean;
          priority: Database['public']['Enums']['notification_priority'];
          action_url: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          type: Database['public']['Enums']['activity_type'];
          title: string;
          description: string;
          read?: boolean;
          priority?: Database['public']['Enums']['notification_priority'];
          action_url?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          type?: Database['public']['Enums']['activity_type'];
          title?: string;
          description?: string;
          read?: boolean;
          priority?: Database['public']['Enums']['notification_priority'];
          action_url?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
    };

    /**
     * Database Views
     */
    Views: {
      author_stats: {
        Row: {
          author_id: string;
          total_matches: number;
          pending_requests: number;
          upcoming_interviews: number;
          profile_views: number;
          updated_at: string;
        };
      };
    };

    /**
     * Database Functions
     */
    Functions: {
      update_match_status: {
        Args: {
          p_match_id: string;
          p_status: Database['public']['Enums']['match_status'];
        };
        Returns: void;
      };
    };

    /**
     * Database Enums
     */
    Enums: {
      match_status: 'new' | 'viewed' | 'contacted' | 'declined';
      interview_status: 'scheduled' | 'pending' | 'completed' | 'cancelled';
      activity_type: 'match' | 'message' | 'interview' | 'review' | 'system';
      notification_priority: 'low' | 'medium' | 'high';
    };
  };
}
