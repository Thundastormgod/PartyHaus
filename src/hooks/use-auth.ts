import { useEffect, useState } from 'react';
import { usePartyStore } from '@/store/usePartyStore';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export const useAuth = () => {
  const { setUser, logout, setLoading } = usePartyStore();
  const isLoading = usePartyStore((s) => s.isLoading);
  const [authInitialized, setAuthInitialized] = useState(false);
  // Track if auth event has set user
  const [userSetByAuthEvent, setUserSetByAuthEvent] = useState(false);

  // Reset auth flags on logout and login for a clean state
  useEffect(() => {
    const unsub = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') {
        setAuthInitialized(false);
        setUserSetByAuthEvent(false);
      }
    });
    return () => {
      unsub.data?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (authInitialized) {
  // ...existing code...
      return;
    }

    let isSubscribed = true;
  // ...existing code...

    // Clean initialization on login/logout
    const initAuth = async () => {
      try {
        // Debug: start init
  // ...existing code...
        const currentPage = usePartyStore.getState().currentPage;
  // ...existing code...
        if (currentPage !== 'auth') {
          setLoading(true);
          // ...existing code...
        }
        // Only check session, never set/clear user if auth event has fired
          if (!userSetByAuthEvent) {
          // ...existing code...
          const getSessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
            setTimeout(() => resolve({ data: { session: null } }), 5000)
          );
          const sessionResult = (await Promise.race([getSessionPromise, timeoutPromise])) as any;
          // ...existing code...
          // Do NOT set or clear user here; only onAuthStateChange does that
        } else {
          // ...existing code...
        }
      } catch (error) {
  // ...removed bloatware error log...
      } finally {
        if (isSubscribed) {
          setLoading(false);
          setAuthInitialized(true);
          // ...existing code...
        }
      }
    };

    initAuth();

    // Listen for changes in auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isSubscribed) {
      // ...existing code...
        return;
      }
    // ...existing code...
      if (_event === 'SIGNED_IN' && session?.user) {
        setUserSetByAuthEvent(true);
        const normalizedUser = {
          id: session.user.id,
          email: session.user.email ?? '',
          name: session.user.user_metadata?.name,
          user_metadata: session.user.user_metadata
        };
  // ...existing code...
        await setUser(normalizedUser);
        return;
      }
      if (_event === 'SIGNED_OUT') {
        setUserSetByAuthEvent(false);
  // ...existing code...
        setUser(null);
        return;
      }
      // Do not set or clear user for other events
  // ...existing code...
      // Do not set or clear user for other events
  // ...removed bloatware debug log...
    });

    return () => {
      isSubscribed = false;
  // ...existing code...
      try {
        subscription.unsubscribe();
      } catch (e) {
        // noop
      }
    };
  }, [setUser, authInitialized]);

  const signIn = async (email: string, password: string) => {
  // ...removed bloatware debug log...
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
  // ...removed bloatware debug log...
      if (error) throw error;
      return { user: data.user, error: null };
    } catch (error) {
  // ...removed bloatware error log...
      return { user: null, error };
    }
  };

  const signUp = async (email: string, password: string) => {
  // ...removed bloatware debug log...
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
  // ...removed bloatware debug log...
      if (error) throw error;
      return { user: data.user, error: null };
    } catch (error) {
  // ...removed bloatware error log...
      return { user: null, error };
    }
  };

  const signOut = async () => {
  // ...removed bloatware debug log...
    try {
      const { error } = await supabase.auth.signOut();
  // ...removed bloatware debug log...
      if (error) throw error;
      // Unsubscribe from all realtime channels (if any)
      if (window.__partyhausCleanupRealtime) {
  // ...removed bloatware debug log...
        window.__partyhausCleanupRealtime();
        window.__partyhausCleanupRealtime = undefined;
      }
      logout();
  // ...removed bloatware debug log...
    } catch (error) {
  // ...removed bloatware error log...
    }
  };

  return {
    signIn,
    signUp,
    signOut,
    isLoading,
  };
};

export const useUser = () => {
  // Single source of truth: read user/loading from the global store
  const user = usePartyStore((s) => s.user);
  const isLoading = usePartyStore((s) => s.isLoading);

  return { user, isLoading };
};

export const useRequireAuth = () => {
  const { user, isLoading } = useUser();
  const isAuthorized = !!user;

  return { isAuthorized, isLoading };
};
