'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/Toasts/toaster';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  );
}
