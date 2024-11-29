'use client';

import { DashboardClientWrapper } from '@/components/dashboard/DashboardClientWrapper';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function DashboardRootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardClientWrapper>
      <DashboardLayout>{children}</DashboardLayout>
    </DashboardClientWrapper>
  );
}
