'use client';

import { DashboardProvider } from '@/contexts/dashboard/DashboardContext';

export function DashboardClientWrapper({
  children
}: {
  children: React.ReactNode;
}) {
  return <DashboardProvider>{children}</DashboardProvider>;
}
