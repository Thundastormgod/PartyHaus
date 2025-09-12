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
  location?: string;
  max_guests?: number;
  is_public: boolean;
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
  setUser: (user: User | null) => void;
  setCurrentPage: (page: string) => void;
  setEvents: (events: Event[]) => void;
  setCurrentEvent: (event: Event | null) => Promise<void>;
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
      loadedEventIds: new Set<string>(),
      fetchingEventId: null,
      isLoading: false,

      setUser: (user) => {
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
            isLoading: false
          });

          const loadEvents = async () => {
            try {
              const events = await eventService.getUserEvents(user.id);
              set((state) => {
                if (state.user?.id === user.id) {
                  return { events, currentEvent: events.length > 0 ? events[0] : null, isLoading: false };
                }
                return state;
              });
            } catch (error) {
              console.warn('Failed to load user events:', error);
              set((state) => ({ ...state, isLoading: false }));
            }
          };

          if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            window.requestIdleCallback(loadEvents);
          } else {
            setTimeout(loadEvents, 100);
          }
        } else {
          set({
            user: null,
            isAuthenticated: false,
            events: [],
            currentEvent: null,
            guests: [],
            isLoading: false,
            loadedEventIds: new Set<string>()
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
          set({ currentEvent: null, guests: [] });
          return;
        }

        if (state.currentEvent?.id === event.id && state.loadedEventIds.has(event.id)) {
          return;
        }

        if (state.fetchingEventId === event.id) {
          return;
        }

        set({ currentEvent: event, fetchingEventId: event.id, isLoading: true });

        try {
          const guests = await eventService.getEventGuests(event.id);
          set((s) => ({
            ...s,
            guests,
            loadedEventIds: new Set([...s.loadedEventIds, event.id]),
            fetchingEventId: null,
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to load event guests:', error);
          set((s) => ({
            ...s,
            guests: [],
            fetchingEventId: null,
            isLoading: false
          }));
        }
      },

      setGuests: (guests) => set({ guests }),
      addGuest: (guest) => set((state) => ({ guests: [...state.guests, guest] })),
      updateGuest: (guestId, updates) => set((state) => ({
        guests: state.guests.map(guest => 
          guest.id === guestId ? { ...guest, ...updates } : guest
        )
      })),
      setLoading: (loading) => set({ isLoading: loading }),

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