import type { User } from '@supabase/supabase-js';

declare module 'next-auth' {
  interface Session {
    user: User & {
      email_verified?: boolean;
    };
  }
}
