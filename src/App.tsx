import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Loading } from "@/components/ui/loading";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePartyStore } from "@/store/usePartyStore";
import { AuthScreen } from "@/components/AuthScreen";
import { useAuth } from "@/hooks/use-auth";
import { Dashboard } from "@/components/Dashboard";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { EventCreation } from "@/components/EventCreation";
import { EventManagement } from "@/components/EventManagement";
import { QRScanner } from "@/components/QRScanner";
import { GuestView } from "@/components/GuestView";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import ErrorBoundary from '@/components/ErrorBoundary';
import DebugPanel from '@/components/DebugPanel';
// install fallback logger early in App lifecycle (moved from main.tsx)
import initLogger from './lib/initLogger';

const queryClient = new QueryClient();

const App = () => {
  // Install the fallback logger right away so we capture logs that might happen during render/effects
  initLogger();
  // Always read currentPage and user from the store (not cached)
  const currentPage = usePartyStore((s) => s.currentPage);
  const user = usePartyStore((s) => s.user);
  const setCurrentPage = usePartyStore((s) => s.setCurrentPage);
  // show a quick loading fallback when we have a persisted currentEvent but no events loaded yet
  const persistedCurrentEvent = usePartyStore((s) => s.currentEvent);
  const events = usePartyStore((s) => s.events);
  const { isLoading } = useAuth();

  useEffect(() => {
    if (!user && currentPage !== 'auth' && !isLoading) {
      setCurrentPage('auth');
    }
    if (user && typeof currentPage === 'string' && currentPage === 'auth' && !isLoading) {
      setCurrentPage('dashboard');
    }
    // Global error hooks to catch silent failures that produce blank pages
    const onErr = (ev: ErrorEvent) => {
      // eslint-disable-next-line no-console
      console.error('Global error caught', ev.error || ev.message, ev);
    };
    const onRej = (ev: PromiseRejectionEvent) => {
      // eslint-disable-next-line no-console
      console.error('Unhandled promise rejection', ev.reason);
    };
    window.addEventListener('error', onErr);
    window.addEventListener('unhandledrejection', onRej);
    return () => {
      window.removeEventListener('error', onErr);
      window.removeEventListener('unhandledrejection', onRej);
    };
  }, [currentPage, user, isLoading, setCurrentPage]);

  if (isLoading) {
    return <Loading fullScreen size="lg" />;
  }

  // If rehydration left us with a currentEvent id/object but no events array populated,
  // show a loading screen while the rehydrate healing logic runs in the store.
  if (persistedCurrentEvent && (!events || events.length === 0)) {
    return <Loading fullScreen size="lg" />;
  }

  const renderPage = () => {
    if (!user) {
      return <AuthScreen />;
    }
    // Handle guest view with dynamic ID
    if (currentPage.startsWith('guest-view-')) {
      const guestId = currentPage.replace('guest-view-', '');
      return <GuestView guestId={guestId} />;
    }
    // Protected routes
    return (
      <ProtectedRoute>
        {(() => {
          switch (currentPage) {
            case 'dashboard':
              return <Dashboard />;
            case 'create-event':
              return <EventCreation />;
            case 'event-management':
              return <EventManagement />;
            case 'qr-scanner':
              return <QRScanner />;
            default:
              return <Dashboard />;
          }
        })()}
      </ProtectedRoute>
    );
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <div className="min-h-screen bg-background text-foreground">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          </div>
          <Toaster />
          <Sonner />
          <DebugPanel />
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
