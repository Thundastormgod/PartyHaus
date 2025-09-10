import { useEffect } from 'react';
import { useRequireAuth } from '@/hooks/use-auth';
import { usePartyStore } from '@/store/usePartyStore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthorized, isLoading } = useRequireAuth();
  const { setCurrentPage, currentPage } = usePartyStore();

  // Navigation logic is now centralized in App.tsx to prevent render loops

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
};
