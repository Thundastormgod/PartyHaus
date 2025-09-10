import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { eventService } from '@/lib/events';
import { supabase } from '@/lib/supabase';

// Utility to clear all state and session for a fresh login
export async function clearAppState() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (usePartyStore as any).setState({
      user: null,
      isAuthenticated: false,
      currentPage: 'auth',
      events: [],
      currentEvent: null,
      guests: [],
      isLoading: false
    });
  } catch (e) {
    // ignore if store isn't ready yet
  }
  // Clear Supabase session if available
  try {
    await supabase.auth.signOut();
  } catch (e) {
    // ignore
  }
}

// Types for our data structures
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
  event_date: string;
  location: string;
  spotify_playlist_url: string;
}

export interface Guest {
  id: string;
  event_id: string;
  name: string;
  email: string;
  is_checked_in: boolean;
}

interface PartyState {
  // Authentication
  user: User | null;
  isAuthenticated: boolean;
  
  // Navigation
  currentPage: string;
  
  // Events
  events: Event[];
  currentEvent: Event | null;
  
  // Guests
  guests: Guest[];

  // Currently fetching guests for this event (prevents duplicate fetches)
  fetchingEventId?: string | null;
  
  // Loading states
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setCurrentPage: (page: string) => void;
  setEvents: (events: Event[]) => void;
  setCurrentEvent: (event: Event | null) => void;
  setGuests: (guests: Guest[]) => void;
  addGuest: (guest: Guest) => void;
  updateGuest: (guestId: string, updates: Partial<Guest>) => void;
  setLoading: (loading: boolean) => void;
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
  fetchingEventId: null,
      isLoading: false,

      setUser: (user) => {
        const currentUser = get().user;
        const isUserComplete = user && user.id && (user.user_metadata || user.name || user.email);
        if (currentUser?.id === user?.id && !!user && isUserComplete) {
          return;
        }
        if (user) {
          const normalizedUser = {
            id: user.id,
            email: user.email ?? '',
            user_metadata: user.user_metadata || {},
            name: user.user_metadata?.name || user.name || user.email || 'User'
          };
          set({
            user: normalizedUser,
            isAuthenticated: true,
            currentPage: 'dashboard',
            isLoading: true,
            events: [],
            currentEvent: null,
            guests: []
          });
          (async () => {
            try {
              await supabase
                .from('users')
                .upsert({
                  id: normalizedUser.id,
                  email: normalizedUser.email,
                  name: normalizedUser.name ?? null
                }, { onConflict: 'id' });
              const events = await eventService.getUserEvents(user.id);
              set((state) => {
                let newCurrentEvent = state.currentEvent;
                if ((!state.currentEvent || !events.some(e => e.id === state.currentEvent?.id)) && events.length > 0) {
                  newCurrentEvent = events[0];
                } else if (events.length === 0) {
                  newCurrentEvent = null;
                }
                return {
                  ...state,
                  events,
                  currentEvent: newCurrentEvent,
                  isLoading: false
                };
              });
            } catch (error) {
              set((state) => ({ ...state, events: [], currentEvent: null, isLoading: false }));
            }
          })();
        } else {
          set({
            user: null,
            isAuthenticated: false,
            currentPage: 'auth',
            events: [],
            currentEvent: null,
            guests: [],
            isLoading: false
          });
        }
      },

      fetchEvents: async () => {
        const user = get().user;
        if (!user) return;
        set((state) => ({ ...state, isLoading: true }));
        try {
          const events = await eventService.getUserEvents(user.id);
          set((state) => {
            let newCurrentEvent = state.currentEvent;
            if ((!state.currentEvent || !events.some(e => e.id === state.currentEvent?.id)) && events.length > 0) {
              newCurrentEvent = events[0];
            } else if (events.length === 0) {
              newCurrentEvent = null;
            }
            return {
              ...state,
              events,
              currentEvent: newCurrentEvent,
              isLoading: false
            };
          });
        } catch (error) {
          set((state) => ({ ...state, events: [], currentEvent: null, isLoading: false }));
        }
      },


      setCurrentPage: (page) => {
        // Only update if different to prevent render loops
        if (get().currentPage !== page) set({ currentPage: page });
      },
      setEvents: (events) => set({ events }),
      setCurrentEvent: async (event) => {
        const state = get();
        const eventGuestsLoaded = event && state.guests.some(g => g.event_id === event.id);

        // Debug trace to help find render loops
        try {
          // eslint-disable-next-line no-console
          console.info('[store] setCurrentEvent called', {
            eventId: event?.id ?? null,
            currentEventId: state.currentEvent?.id ?? null,
            fetchingEventId: state.fetchingEventId ?? null,
            guestsLoaded: !!eventGuestsLoaded
          });
        } catch (err) {
          // ignore
        }

        // If nothing to do, set and return
        if (!event || (state.currentEvent && state.currentEvent.id === event.id && eventGuestsLoaded)) {
          if (state.fetchingEventId) set({ fetchingEventId: null });
          set((s) => ({
            // ensure events list contains the current event so UI components relying on events don't see an empty list
            events: event && !s.events.some(e => e.id === event.id) ? [...s.events, event] : s.events,
            currentEvent: event,
            isLoading: false
          }));
          // eslint-disable-next-line no-console
          console.info('[store] setCurrentEvent early return', { eventId: event?.id ?? null });
          return;
        }

        // Prevent duplicate fetches for the same event
        if (state.fetchingEventId && event && state.fetchingEventId === event.id) {
          return;
        }

        // mark fetching event id
        if (event) set({ fetchingEventId: event.id, isLoading: true });

        try {
          const guests = await eventService.getEventGuests(event.id);
          set((s) => ({
            events: s.events.some(e => e.id === event.id) ? s.events : [...s.events, event],
            currentEvent: event,
            guests,
            isLoading: false,
            fetchingEventId: null
          }));
          // eslint-disable-next-line no-console
          console.info('[store] setCurrentEvent completed fetch', { eventId: event.id, guestsCount: guests.length });
        } catch (e) {
          set((s) => ({
            events: s.events.some(e => e.id === event.id) ? s.events : [...s.events, event],
            currentEvent: event,
            guests: [],
            isLoading: false,
            fetchingEventId: null
          }));
          // eslint-disable-next-line no-console
          console.info('[store] setCurrentEvent fetch failed', { eventId: event.id, error: (e as Error)?.message });
        }
      },
      setGuests: (guests) => set({ guests }),
      addGuest: (guest) => set((state) => ({ guests: [...state.guests, guest] })),
      updateGuest: (guestId, updates) => set((state) => ({
        guests: state.guests.map(guest => guest.id === guestId ? { ...guest, ...updates } : guest)
      })),
      setLoading: (loading) => set({ isLoading: loading }),
      logout: () => { clearAppState(); }
    }),
    {
      name: 'party-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        currentPage: state.currentPage,
        currentEvent: state.currentEvent
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) return;
        if (state?.user) {
          state.isAuthenticated = true;
          state.currentPage = state.currentPage || 'dashboard';
          // If we have a currentEvent persisted but no events list, attempt to fetch the specific event and its guests
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          (async () => {
            try {
              const userId = state.user?.id;
              if (!userId) return;
              // If events array is empty but there is a currentEvent id or partial, try to fetch that event directly
              if ((!state.events || state.events.length === 0) && state.currentEvent) {
                let eventObj: any = state.currentEvent as any;
                // If it's a string id, fetch the event
                if (typeof eventObj === 'string') {
                  eventObj = await eventService.getEventById(eventObj);
                } else if (eventObj && typeof eventObj === 'object' && !eventObj.name && eventObj.id) {
                  // try to fetch full event by id
                  const fetched = await eventService.getEventById(eventObj.id);
                  if (fetched) eventObj = fetched;
                }

                if (eventObj && eventObj.id) {
                  // fetch guests for that event
                  const guests = await eventService.getEventGuests(eventObj.id);
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (usePartyStore as any).setState({ events: [eventObj], currentEvent: eventObj, guests });
                  return;
                }

                // fallback: fetch all user events
                const events = await eventService.getUserEvents(userId);
                if (events && events.length > 0) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (usePartyStore as any).setState({ events, currentEvent: events.find(e => e.id === (state.currentEvent as any)?.id) || events[0] });
                  return;
                }

                // If no events were found for the user, clear the stale currentEvent and navigate to dashboard
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (usePartyStore as any).setState({ events: [], currentEvent: null, currentPage: 'dashboard' });
                return;
              }

              // If events exist but currentEvent is an ID string, try to replace it with the object
              if (state.currentEvent && typeof state.currentEvent === 'string') {
                const events = state.events;
                const found = events.find(e => e.id === state.currentEvent as unknown as string);
                if (found) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (usePartyStore as any).setState({ currentEvent: found });
                }
              }
            } catch (e) {
              // ignore network errors here; store will heal on next fetch
            }
          })();
        } else {
          state.isAuthenticated = false;
          state.currentPage = 'auth';
        }
      }
    }
  )
);