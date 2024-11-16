export type Database = {
  public: {
    Tables: {
      author_profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          bio: string | null
          expertise: string[] | null
          target_topics: string[] | null
          social_links: { [key: string]: string } | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          bio?: string | null
          expertise?: string[] | null
          target_topics?: string[] | null
          social_links?: { [key: string]: string } | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          bio?: string | null
          expertise?: string[] | null
          target_topics?: string[] | null
          social_links?: { [key: string]: string } | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      books: {
        Row: {
          id: string
          author_id: string
          title: string
          description: string | null
          genre: string[] | null
          target_audience: string[] | null
          cover_url: string | null
          keywords: string[] | null
          created_at: string
          updated_at: string
          book_links: { [key: string]: string } | null
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          description?: string | null
          genre?: string[] | null
          target_audience?: string[] | null
          cover_url?: string | null
          keywords?: string[] | null
          created_at?: string
          updated_at?: string
          book_links?: { [key: string]: string } | null
        }
        Update: {
          id?: string
          author_id?: string
          title?: string
          description?: string | null
          genre?: string[] | null
          target_audience?: string[] | null
          cover_url?: string | null
          keywords?: string[] | null
          created_at?: string
          updated_at?: string
          book_links?: { [key: string]: string } | null
        }
      }
      podcast_matches: {
        Row: {
          id: string
          author_id: string
          book_id: string
          podcast_id: string
          podcast_name: string
          podcast_description: string | null
          host_name: string | null
          relevance_score: number | null
          status: string
          matched_at: string
        }
        Insert: {
          id?: string
          author_id: string
          book_id: string
          podcast_id: string
          podcast_name: string
          podcast_description?: string | null
          host_name?: string | null
          relevance_score?: number | null
          status?: string
          matched_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          book_id?: string
          podcast_id?: string
          podcast_name?: string
          podcast_description?: string | null
          host_name?: string | null
          relevance_score?: number | null
          status?: string
          matched_at?: string
        }
      }
    }
  }
}
