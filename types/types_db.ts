export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          stripe_customer_id: string | null
        }
        Insert: {
          id: string
          stripe_customer_id?: string | null
        }
      }
      products: {
        Row: {
          id: string
          active: boolean
          name: string
          description: string | null
          image: string | null
          metadata: Json | null
        }
        Insert: {
          id: string
          active?: boolean
          name: string
          description?: string | null
          image?: string | null
          metadata?: Json | null
        }
      }
      prices: {
        Row: {
          id: string
          product_id: string
          active: boolean
          currency: string
          type: string
          unit_amount: number | null
          interval: string | null
          interval_count: number | null
          trial_period_days: number | null
        }
        Insert: {
          id: string
          product_id: string
          active?: boolean
          currency: string
          type: string
          unit_amount?: number | null
          interval?: string | null
          interval_count?: number | null
          trial_period_days?: number | null
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          status: string
          metadata: Json | null
          price_id: string
          quantity: number | null
          cancel_at_period_end: boolean
          created: string
          current_period_start: string
          current_period_end: string
          ended_at: string | null
          cancel_at: string | null
          canceled_at: string | null
          trial_start: string | null
          trial_end: string | null
        }
        Insert: {
          id: string
          user_id: string
          status: string
          metadata?: Json | null
          price_id: string
          quantity?: number | null
          cancel_at_period_end?: boolean
          created: string
          current_period_start: string
          current_period_end: string
          ended_at?: string | null
          cancel_at?: string | null
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'] 