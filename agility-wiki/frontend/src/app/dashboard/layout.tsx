'use client';

import { useAuth } from '@/src/hooks/useAuth';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useAuth();

  return <>{children}</>;
}
