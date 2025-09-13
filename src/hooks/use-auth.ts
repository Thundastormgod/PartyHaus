import { useEffect } from 'react';
import { usePartyStore } from '@/store/usePartyStore';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export const useAuth = () => {
  const isLoading = usePartyStore((s) => s.isLoading);

  useEffect(() => {
    let mounted = true;
    let isLoggingOut = false; // GUARD: Prevent double logout
    let retryCount = 0;
    const MAX_RETRIES = 3;

    // Simple auth state listener - no complex flags or race condition logic
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      try {
        if (event === 'SIGNED_IN' && session?.user) {
          isLoggingOut = false; // Reset logout guard
          
          // Validate user data before processing
          if (!session.user.id || !session.user.email) {
            console.warn('Invalid user data in SIGNED_IN event');
            return;
          }
          
          // User signed in - set user in store
          const normalizedUser = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email.split('@')[0],
            user_metadata: session.user.user_metadata || {}
          };
          
          await usePartyStore.getState().setUser(normalizedUser);
        } else if (event === 'SIGNED_OUT' && !isLoggingOut) {
          isLoggingOut = true; // Set guard to prevent double logout
          // User signed out - clear user from store
          usePartyStore.getState().logout();
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Silently update user data on token refresh if needed
          const currentUser = usePartyStore.getState().user;
          if (currentUser?.id !== session.user.id) {
            console.warn('User ID mismatch on token refresh');
            usePartyStore.getState().logout();
          }
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        // On critical errors, force logout to prevent corrupted state
        if (retryCount >= MAX_RETRIES) {
          console.error('Max retries exceeded, forcing logout');
          usePartyStore.getState().logout();
        } else {
          retryCount++;
        }
      }
    });

    // Check for existing session on mount with retry logic
    const checkSession = async () => {
      if (!mounted) return;

      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts && mounted) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.warn(`Session check attempt ${attempts + 1} failed:`, error);
            attempts++;
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
              continue;
            }
            throw error;
          }
          
          if (session?.user) {
            // Validate session data
            if (!session.user.id || !session.user.email) {
              console.warn('Invalid session data');
              break;
            }
            
            const normalizedUser = {
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.name || session.user.email.split('@')[0],
              user_metadata: session.user.user_metadata || {}
            };
            await usePartyStore.getState().setUser(normalizedUser);
          }
          break; // Success, exit retry loop
        } catch (error) {
          console.warn(`Session check failed (attempt ${attempts + 1}):`, error);
          attempts++;
          if (attempts < maxAttempts && mounted) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          }
        }
      }

      if (mounted) {
        usePartyStore.getState().setLoading(false);
      }
    };

    checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // Remove function dependencies to prevent infinite loops
    // Zustand actions are stable, but we'll use the store directly to be safe
  }, []);

  const signIn = async (email: string, password: string) => {
    // Input validation and sanitization
    if (!email || typeof email !== 'string') {
      return { user: null, error: new Error('Invalid email provided') };
    }
    if (!password || typeof password !== 'string') {
      return { user: null, error: new Error('Invalid password provided') };
    }
    
    const sanitizedEmail = email.trim().toLowerCase();
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return { user: null, error: new Error('Invalid email format') };
    }
    
    // Password strength check
    if (password.length < 6) {
      return { user: null, error: new Error('Password must be at least 6 characters') };
    }

    try {
      usePartyStore.getState().setLoading(true);
      
      // Set timeout for auth request
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign in timeout - please try again')), 30000)
      );
      
      const authPromise = supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });
      
      const { data, error } = await Promise.race([authPromise, timeoutPromise]) as any;
      
      if (error) throw error;
      return { user: data.user, error: null };
    } catch (error: any) {
      usePartyStore.getState().setLoading(false);
      // Normalize error messages for security
      const sanitizedError = error.message?.includes('Invalid login credentials') 
        ? new Error('Invalid email or password')
        : error.message?.includes('timeout')
        ? new Error('Connection timeout - please check your internet connection')
        : new Error('Sign in failed - please try again');
      return { user: null, error: sanitizedError };
    }
  };

  const signUp = async (email: string, password: string) => {
    // Input validation and sanitization
    if (!email || typeof email !== 'string') {
      return { user: null, error: new Error('Invalid email provided') };
    }
    if (!password || typeof password !== 'string') {
      return { user: null, error: new Error('Invalid password provided') };
    }
    
    const sanitizedEmail = email.trim().toLowerCase();
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return { user: null, error: new Error('Invalid email format') };
    }
    
    // Strong password validation
    if (password.length < 8) {
      return { user: null, error: new Error('Password must be at least 8 characters') };
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { user: null, error: new Error('Password must contain uppercase, lowercase, and numbers') };
    }

    try {
      usePartyStore.getState().setLoading(true);
      
      // Set timeout for auth request
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign up timeout - please try again')), 30000)
      );
      
      const authPromise = supabase.auth.signUp({
        email: sanitizedEmail,
        password,
      });
      
      const { data, error } = await Promise.race([authPromise, timeoutPromise]) as any;
      
      if (error) throw error;
      return { user: data.user, error: null };
    } catch (error: any) {
      usePartyStore.getState().setLoading(false);
      // Normalize error messages for security
      const sanitizedError = error.message?.includes('User already registered')
        ? new Error('An account with this email already exists')
        : error.message?.includes('timeout')
        ? new Error('Connection timeout - please check your internet connection')
        : new Error('Sign up failed - please try again');
      return { user: null, error: sanitizedError };
    }
  };

  const signOut = async () => {
    const store = usePartyStore.getState();
    
    // Prevent double logout attempts
    if (store.isLoading) {
      console.warn('Logout already in progress');
      return;
    }

    try {
      store.setLoading(true);
      
      // Set timeout for sign out request
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign out timeout')), 15000)
      );
      
      const signOutPromise = supabase.auth.signOut();
      const { error } = await Promise.race([signOutPromise, timeoutPromise]) as any;
      
      if (error && !error.message?.includes('timeout')) {
        console.warn('Supabase signOut failed:', error);
        // Continue with local logout even if server fails
      }
      
      // Always clear local state regardless of server response
      store.logout();
    } catch (error: any) {
      console.warn('Sign out error:', error);
      // Force local logout even on error to prevent stuck state
      usePartyStore.getState().logout();
    } finally {
      usePartyStore.getState().setLoading(false);
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
