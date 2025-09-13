import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { eventService } from '@/lib/events';
import { supabase } from '@/lib/supabase';

export interface User {
  id: string;
  email: string;
  name?: string;
  user_metadata?: {
    name?: string;
  };
}

export interface Event {
  id: string;
  host_id: string;
  name: string;
  description?: string;
  date: string;
  event_date: string; // Database field
  location?: string;
  max_guests?: number;
  is_public: boolean;
  spotify_playlist_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Guest {
  id: string;
  event_id: string;
  name: string;
  email?: string;
  phone?: string;
  status: 'pending' | 'confirmed' | 'checked_in' | 'no_show';
  is_checked_in: boolean; // Computed field for compatibility
  plus_ones: number;
  special_requirements?: string;
  checked_in_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PartyState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentPage: 'auth' | 'dashboard' | 'create-event' | 'event-management' | 'qr-scanner' | string;
  events: Event[];
  currentEvent: Event | null;
  guests: Guest[];
  loadedEventIds: Set<string>;
  fetchingEventId: string | null;
  setUser: (user: User | null) => Promise<void>;
  setCurrentPage: (page: string) => void;
  setEvents: (events: Event[]) => void;
  setCurrentEvent: (event: Event | null) => Promise<void>;
  setGuests: (guests: Guest[]) => void;
  addGuest: (guest: Guest) => void;
  updateGuest: (guestId: string, updates: Partial<Guest>) => void;
  setLoading: (loading: boolean) => void;
  forceReloadEvents: () => Promise<void>;
  logout: () => void;
}

export const usePartyStore = create<PartyState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      currentPage: 'auth',
      events: [],
      currentEvent: null,
      guests: [],
      loadedEventIds: new Set<string>(),
      fetchingEventId: null,
      isLoading: false,

      setUser: async (user) => {
        if (user) {
          // Validate required user fields
          if (!user.id || typeof user.id !== 'string') {
            console.error('Invalid user ID provided');
            return;
          }
          if (!user.email || typeof user.email !== 'string') {
            console.error('Invalid user email provided');
            return;
          }

          const normalizedUser = {
            id: user.id.trim(),
            email: user.email.trim().toLowerCase(),
            user_metadata: user.user_metadata || {},
            name: (user.user_metadata?.name || user.name || user.email.split('@')[0] || 'User').trim()
          };

          // Prevent setting the same user multiple times (performance optimization)
          const currentState = get();
          if (currentState.user?.id === normalizedUser.id && currentState.isAuthenticated && currentState.events.length > 0) {
            console.log('User already set with events loaded, skipping duplicate setUser call');
            return;
          }

          // If user is the same but events aren't loaded, just load events
          if (currentState.user?.id === normalizedUser.id && currentState.isAuthenticated && currentState.events.length === 0) {
            console.log('User already set but events not loaded, loading events...');
            // Skip user setting, just load events
          } else {
            // Set user normally
            set({
              user: normalizedUser,
              isAuthenticated: true,
              isLoading: false
            });
          }

          // Load events with retry logic and proper error handling
          const loadEventsWithRetry = async (retryCount = 0) => {
            const MAX_RETRIES = 3;
            console.log(`Loading events for user ${user.id} (attempt ${retryCount + 1})`);
            
            try {
              const events = await eventService.getUserEvents(user.id);
              console.log(`Loaded ${events?.length || 0} events for user ${user.id}:`, events);
              
              // Validate events data
              const validEvents = Array.isArray(events) ? events.filter(event => 
                event && typeof event === 'object' && event.id && event.host_id === user.id
              ) : [];

              console.log(`Validated ${validEvents.length} events for user ${user.id}`);

              set((state) => {
                // Double-check user hasn't changed during async operation
                if (state.user?.id === user.id) {
                  console.log(`Setting ${validEvents.length} events in store`);
                  return { 
                    events: validEvents, 
                    currentEvent: validEvents.length > 0 ? validEvents[0] : null, 
                    isLoading: false 
                  };
                }
                console.log('User changed during async operation, not setting events');
                return state;
              });
            } catch (error) {
              console.warn(`Failed to load user events (attempt ${retryCount + 1}):`, error);
              
              if (retryCount < MAX_RETRIES) {
                // Exponential backoff retry
                setTimeout(() => loadEventsWithRetry(retryCount + 1), 1000 * Math.pow(2, retryCount));
              } else {
                console.error('Max retries exceeded for loading events');
                set((state) => ({ ...state, isLoading: false }));
              }
            }
          };

          // Use requestIdleCallback for better performance, fallback to setTimeout
          if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            window.requestIdleCallback(() => loadEventsWithRetry());
          } else {
            setTimeout(() => loadEventsWithRetry(), 100);
          }
        } else {
          // Clear user state
          set({
            user: null,
            isAuthenticated: false,
            events: [],
            currentEvent: null,
            guests: [],
            isLoading: false,
            loadedEventIds: new Set<string>(),
            fetchingEventId: null
          });
        }
      },

      setCurrentPage: (page) => {
        if (get().currentPage !== page) set({ currentPage: page });
      },

      setEvents: (events) => set({ events }),

      setCurrentEvent: async (event) => {
        const state = get();
        
        if (!event) {
          set({ currentEvent: null, guests: [], fetchingEventId: null });
          return;
        }

        // Validate event data
        if (!event.id || typeof event.id !== 'string') {
          console.error('Invalid event ID provided to setCurrentEvent');
          return;
        }

        // Check if already set and loaded
        if (state.currentEvent?.id === event.id && state.loadedEventIds.has(event.id)) {
          return;
        }

        // Prevent duplicate requests
        if (state.fetchingEventId === event.id) {
          return;
        }

        // Ensure user owns this event (security check)
        if (state.user && event.host_id !== state.user.id) {
          console.warn('User attempting to access event they do not own');
          return;
        }

        set({ currentEvent: event, fetchingEventId: event.id, isLoading: true });

        let retryCount = 0;
        const MAX_RETRIES = 3;

        const fetchGuestsWithRetry = async () => {
          try {
            const guests = await eventService.getEventGuests(event.id);
            
            // Validate guests data
            const validGuests = Array.isArray(guests) ? guests.filter(guest => 
              guest && typeof guest === 'object' && guest.id && guest.event_id === event.id
            ) : [];

            set((s) => {
              // Ensure we're still working with the same event
              if (s.fetchingEventId === event.id) {
                return {
                  ...s,
                  guests: validGuests,
                  loadedEventIds: new Set([...s.loadedEventIds, event.id]),
                  fetchingEventId: null,
                  isLoading: false
                };
              }
              return s;
            });
          } catch (error) {
            console.error(`Failed to load event guests (attempt ${retryCount + 1}):`, error);
            
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              // Exponential backoff
              setTimeout(fetchGuestsWithRetry, 1000 * Math.pow(2, retryCount - 1));
            } else {
              console.error('Max retries exceeded for loading guests');
              set((s) => ({
                ...s,
                guests: [],
                fetchingEventId: null,
                isLoading: false
              }));
            }
          }
        };

        await fetchGuestsWithRetry();
      },

      setGuests: (guests) => set({ guests }),
      addGuest: (guest) => set((state) => ({ guests: [...state.guests, guest] })),
      updateGuest: (guestId, updates) => set((state) => ({
        guests: state.guests.map(guest => 
          guest.id === guestId ? { ...guest, ...updates } : guest
        )
      })),
      setLoading: (loading) => set({ isLoading: loading }),

      forceReloadEvents: async () => {
        const state = get();
        if (!state.user?.id) {
          console.warn('No user available to reload events');
          return;
        }

        console.log('Force reloading events...');
        set({ isLoading: true });

        try {
          const events = await eventService.getUserEvents(state.user.id);
          console.log(`Force loaded ${events?.length || 0} events:`, events);
          
          const validEvents = Array.isArray(events) ? events.filter(event => 
            event && typeof event === 'object' && event.id && event.host_id === state.user.id
          ) : [];

          set({
            events: validEvents,
            currentEvent: validEvents.length > 0 ? validEvents[0] : null,
            isLoading: false
          });
        } catch (error) {
          console.error('Failed to force reload events:', error);
          set({ isLoading: false });
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          currentPage: 'auth',
          events: [],
          currentEvent: null,
          guests: [],
          isLoading: false,
          loadedEventIds: new Set<string>()
        });
        
        supabase.auth.signOut().catch(e => {
          console.warn('Logout: Supabase sign out failed:', e);
        });
      },
    }),
    {
      name: 'party-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        currentPage: state.currentPage,
        events: state.events,
        currentEvent: state.currentEvent
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Failed to rehydrate store:', error);
          return;
        }
        
        if (state) {
          state.loadedEventIds = new Set<string>();
          state.fetchingEventId = null;
          state.isLoading = false;
          
          if (state.currentEvent && (!state.events || state.events.length === 0)) {
            state.currentEvent = null;
          }
        }
      }
    }
  )
);