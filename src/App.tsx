import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Loading } from "@/components/ui/loading";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePartyStore } from "@/store/usePartyStore";
import { AuthScreen } from "@/components/AuthScreen";
import { LandingPage } from "@/components/LandingPage";
import { useAuth } from "@/hooks/use-auth";
import { Dashboard } from "@/components/Dashboard";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { EventCreation } from "@/components/EventCreation";
import { EventManagement } from "@/components/EventManagement";
import { QRScanner } from "@/components/QRScanner";
import { GuestView } from "@/components/GuestView";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { HardenedErrorBoundary } from '@/components/HardenedErrorBoundary';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';

const queryClient = new QueryClient();

const GuestRoute = () => {
  const { eventId, guestId } = useParams<{ eventId: string; guestId: string }>();
  return <GuestView guestId={guestId || ''} eventId={eventId || ''} />;
};

const App = () => {
  // Always read currentPage and user from the store (not cached)
  const currentPage = usePartyStore((s) => s.currentPage);
  const user = usePartyStore((s) => s.user);
  // show a quick loading fallback when we have a persisted currentEvent but no events loaded yet
  const persistedCurrentEvent = usePartyStore((s) => s.currentEvent);
  const events = usePartyStore((s) => s.events);
  const { isLoading } = useAuth();

  // New state for landing/auth flow
  const [appMode, setAppMode] = useState<'landing' | 'auth' | 'app'>('landing');
  const [userIntent, setUserIntent] = useState<'create_event' | 'join_event' | 'explore_features'>('explore_features');

  useEffect(() => {
    // Enhanced routing logic with landing page support
    if (user) {
      setAppMode('app');
      if (currentPage === 'auth' || currentPage === 'landing') {
        usePartyStore.getState().setCurrentPage('dashboard');
      }
    } else {
      // If no user and we're in app mode, show auth directly
      if (appMode === 'app') {
        setAppMode('auth');
      }
      // Don't auto-redirect to auth from landing - let user choose
    }
  }, [user?.id, currentPage, appMode]);

  const handleGetStarted = (intent: 'create_event' | 'join_event' | 'explore_features' = 'create_event') => {
    setUserIntent(intent);
    setAppMode('auth');
  };

  const handleSignIn = () => {
    setUserIntent('explore_features');
    setAppMode('auth');
  };

  const handleBackToLanding = () => {
    setAppMode('landing');
  };

  if (isLoading) {
    return <Loading fullScreen size="lg" />;
  }

  // If rehydration left us with a currentEvent id/object but no events array populated,
  // show a loading screen while the rehydrate healing logic runs in the store.
  if (persistedCurrentEvent && (!events || events.length === 0) && user) {
    return <Loading fullScreen size="lg" />;
  }

  const renderPage = () => {
    // Landing and Auth Flow
    if (!user) {
      if (appMode === 'landing') {
        return (
          <LandingPage 
            onGetStarted={() => handleGetStarted('create_event')}
            onSignIn={handleSignIn}
          />
        );
      } else {
        return (
          <AuthScreen 
            initialMode="auth"
            userIntent={userIntent}
            onBackToLanding={handleBackToLanding}
          />
        );
      }
    }

    // Handle guest view with dynamic ID
    if (currentPage.startsWith('guest-view-')) {
      const guestId = currentPage.replace('guest-view-', '');
      return <GuestView guestId={guestId} />;
    }

    // Protected routes for authenticated users
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
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <HardenedErrorBoundary>
            <div className="min-h-screen bg-background text-foreground">
              <Routes>
                <Route path="/event/:eventId/guest/:guestId" element={<GuestRoute />} />
                <Route path="*" element={
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={appMode + currentPage}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {renderPage()}
                    </motion.div>
                  </AnimatePresence>
                } />
              </Routes>
            </div>
            <Toaster />
            <Sonner />
          </HardenedErrorBoundary>
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default App;
