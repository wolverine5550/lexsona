import type { User } from '@supabase/supabase-js';

export interface ExtendedUser extends User {
  email_verified?: boolean;
}

export interface SessionData {
  id: string;
  user?: User;
  last_sign_in_at?: string;
  current?: boolean;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          topics: string[];
          preferred_length: string;
          style_preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topics: string[];
          preferred_length: string;
          style_preferences: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          topics?: string[];
          preferred_length?: string;
          style_preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      message_templates: {
        Row: {
          id: string;
          title: string;
          content: string;
          status: 'draft' | 'active' | 'archived';
          category_id: string;
          created_at: string;
          updated_at: string;
          created_by: string;
          last_modified_by: string;
          is_default: boolean;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          status?: 'draft' | 'active' | 'archived';
          category_id: string;
          created_at?: string;
          updated_at?: string;
          created_by: string;
          last_modified_by: string;
          is_default?: boolean;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          status?: 'draft' | 'active' | 'archived';
          category_id?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string;
          last_modified_by?: string;
          is_default?: boolean;
          metadata?: Json | null;
        };
      };
      template_categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      template_placeholders: {
        Row: {
          id: string;
          key: string;
          label: string;
          description: string | null;
          default_value: string | null;
          template_id: string;
        };
        Insert: {
          id?: string;
          key: string;
          label: string;
          description?: string | null;
          default_value?: string | null;
          template_id: string;
        };
        Update: {
          id?: string;
          key?: string;
          label?: string;
          description?: string | null;
          default_value?: string | null;
          template_id?: string;
        };
      };
      email_drafts: {
        Row: {
          id: string;
          subject: string;
          content: string;
          status: 'draft' | 'scheduled' | 'sent';
          recipient_email: string | null;
          recipient_name: string | null;
          template_id: string | null;
          scheduled_for: string | null;
          created_at: string;
          updated_at: string;
          created_by: string;
          last_modified_by: string;
          metadata: Json | null;
          attachments: Json[] | null;
        };
        Insert: {
          id?: string;
          subject: string;
          content: string;
          status?: 'draft' | 'scheduled' | 'sent';
          recipient_email?: string | null;
          recipient_name?: string | null;
          template_id?: string | null;
          scheduled_for?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by: string;
          last_modified_by: string;
          metadata?: Json | null;
          attachments?: Json[] | null;
        };
        Update: {
          id?: string;
          subject?: string;
          content?: string;
          status?: 'draft' | 'scheduled' | 'sent';
          recipient_email?: string | null;
          recipient_name?: string | null;
          template_id?: string | null;
          scheduled_for?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string;
          last_modified_by?: string;
          metadata?: Json | null;
          attachments?: Json[] | null;
        };
      };
      email_attachments: {
        Row: {
          id: string;
          email_id: string;
          file_name: string;
          file_size: number;
          file_type: string;
          storage_path: string;
          created_at: string;
          created_by: string;
        };
        Insert: {
          id?: string;
          email_id: string;
          file_name: string;
          file_size: number;
          file_type: string;
          storage_path: string;
          created_at?: string;
          created_by: string;
        };
        Update: {
          id?: string;
          email_id?: string;
          file_name?: string;
          file_size?: number;
          file_type?: string;
          storage_path?: string;
          created_at?: string;
          created_by?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      podcast_topic: string;
      podcast_length: string;
    };
  };
}
