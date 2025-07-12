'use client';
import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth'; // Import Session type if you're using TypeScript

interface SessionProviderWrapperProps {
  children: React.ReactNode;
  session: Session | null; // Pass the initial session if available
}

export default function SessionProviderWrapper({ children, session }: SessionProviderWrapperProps) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}