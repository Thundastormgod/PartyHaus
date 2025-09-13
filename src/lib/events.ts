import { supabase } from './supabase';
import { sanitizeObject, robustFetch } from './validation';
import type { Event, Guest } from '@/store/usePartyStore';

// =================== RETRY UTILITIES ===================

const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxRetries - 1) {
        throw lastError;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

// =================== VALIDATION HELPERS ===================

const isValidEvent = (event: any): event is Event => {
  return (
    event &&
    typeof event.name === 'string' &&
    typeof event.event_date === 'string' &&
    typeof event.host_id === 'string' &&
    event.name.trim().length > 0
  );
};

// Separate validation for events that must have an ID (from database)
const isValidEventWithId = (event: any): event is Event => {
  return (
    isValidEvent(event) &&
    typeof event.id === 'string' &&
    event.id.trim().length > 0
  );
};

const isValidGuest = (guest: any): guest is Guest => {
  return (
    guest &&
    typeof guest.id === 'string' &&
    typeof guest.name === 'string' &&
    typeof guest.email === 'string' &&
    typeof guest.event_id === 'string' &&
    guest.name.trim().length > 0 &&
    guest.email.includes('@')
  );
};

// Transform guest data to include computed fields
const transformGuest = (guest: any): Guest => {
  return {
    ...guest,
    is_checked_in: guest.status === 'checked_in' || Boolean(guest.is_checked_in)
  };
};

export const eventService = {
  // Fetch all events for the current user
  getUserEvents: async (userId: string): Promise<Event[]> => {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('Valid user ID is required');
    }

    return withRetry(async () => {
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('host_id', userId)
        .order('event_date', { ascending: true });

      if (error) throw error;

      // Validate and sanitize events data
      const validatedEvents: Event[] = [];
      for (const event of events || []) {
        if (isValidEventWithId(event)) {
          // Use display sanitization for readable fields like name and description
          validatedEvents.push(sanitizeObject(event, {
            displayFields: ['name', 'description', 'location'],
            useDisplaySanitization: false // Only specified fields get display sanitization
          }));
        } else {
          console.warn('Invalid event data received:', event);
        }
      }

      return validatedEvents;
    });
  },

  // Create a new event
  createEvent: async (event: Omit<Event, 'id'>): Promise<Event | null> => {
    if (!event || typeof event !== 'object') {
      throw new Error('Event data is required');
    }

    // Add timestamps
    const eventWithTimestamps = {
      ...event,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Validate event data
    if (!isValidEvent(eventWithTimestamps)) {
      throw new Error('Invalid event data provided');
    }

    return withRetry(async () => {
      const { data, error } = await supabase
        .from('events')
        .insert([sanitizeObject(eventWithTimestamps, {
          displayFields: ['name', 'description', 'location'],
          useDisplaySanitization: false
        })])
        .select()
        .single();

      if (error) throw error;

      // Validate response data
      if (!isValidEventWithId(data)) {
        throw new Error('Invalid event data received from server');
      }

      return sanitizeObject(data, {
        displayFields: ['name', 'description', 'location'],
        useDisplaySanitization: false
      });
    });
  },

  // Update an event
  updateEvent: async (id: string, updates: Partial<Event>): Promise<Event | null> => {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('Valid event ID is required');
    }

    if (!updates || typeof updates !== 'object') {
      throw new Error('Update data is required');
    }

    const sanitizedUpdates = {
      ...sanitizeObject(updates, {
        displayFields: ['name', 'description', 'location'],
        useDisplaySanitization: false
      }),
      updated_at: new Date().toISOString()
    };

    return withRetry(async () => {
      const { data, error } = await supabase
        .from('events')
        .update(sanitizedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Validate response data
      if (!isValidEventWithId(data)) {
        throw new Error('Invalid event data received from server');
      }

      return sanitizeObject(data, {
        displayFields: ['name', 'description', 'location'],
        useDisplaySanitization: false
      });
    });
  },

  // Delete an event
  deleteEvent: async (id: string): Promise<boolean> => {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('Valid event ID is required');
    }

    return withRetry(async () => {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    });
  },

  // Get event guests
  getEventGuests: async (eventId: string): Promise<Guest[]> => {
    if (!eventId || typeof eventId !== 'string' || eventId.trim().length === 0) {
      throw new Error('Valid event ID is required');
    }

    return withRetry(async () => {
      const { data: guests, error } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Validate and sanitize guest data
      const validatedGuests: Guest[] = [];
      for (const guest of guests || []) {
        if (isValidGuest(guest)) {
          const transformedGuest = transformGuest(guest);
          validatedGuests.push(sanitizeObject(transformedGuest, {
            displayFields: ['name', 'email'],
            useDisplaySanitization: false
          }));
        } else {
          console.warn('Invalid guest data received:', guest);
        }
      }

      return validatedGuests;
    });
  },

  // Get single event by id
  getEventById: async (id: string): Promise<Event | null> => {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('Valid event ID is required');
    }

    return withRetry(async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Validate response data
      if (!isValidEventWithId(data)) {
        throw new Error('Invalid event data received from server');
      }

      return sanitizeObject(data, {
        displayFields: ['name', 'description', 'location'],
        useDisplaySanitization: false
      });
    });
  },

  // Add guest to event
  addGuest: async (guest: Omit<Guest, 'id'>): Promise<Guest | null> => {
    if (!guest || typeof guest !== 'object') {
      throw new Error('Guest data is required');
    }

    // Add timestamps
    const guestWithTimestamps = {
      ...guest,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Validate guest data
    if (!isValidGuest(guestWithTimestamps)) {
      throw new Error('Invalid guest data provided');
    }

    return withRetry(async () => {
      const { data, error } = await supabase
        .from('guests')
        .insert([sanitizeObject(guestWithTimestamps, {
          displayFields: ['name', 'email'],
          useDisplaySanitization: false
        })])
        .select()
        .single();

      if (error) throw error;

      // Validate response data
      if (!isValidGuest(data)) {
        throw new Error('Invalid guest data received from server');
      }

      const transformedGuest = transformGuest(data);
      return sanitizeObject(transformedGuest, {
        displayFields: ['name', 'email'],
        useDisplaySanitization: false
      });
    });
  },

  // Update guest
  updateGuest: async (id: string, updates: Partial<Guest>): Promise<Guest | null> => {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('Valid guest ID is required');
    }

    if (!updates || typeof updates !== 'object') {
      throw new Error('Update data is required');
    }

    const sanitizedUpdates = {
      ...sanitizeObject(updates, {
        displayFields: ['name', 'email'],
        useDisplaySanitization: false
      }),
      updated_at: new Date().toISOString()
    };

    return withRetry(async () => {
      const { data, error } = await supabase
        .from('guests')
        .update(sanitizedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Validate response data
      if (!isValidGuest(data)) {
        throw new Error('Invalid guest data received from server');
      }

      const transformedGuest = transformGuest(data);
      return sanitizeObject(transformedGuest, {
        displayFields: ['name', 'email'],
        useDisplaySanitization: false
      });
    });
  },

  // Remove guest
  removeGuest: async (id: string): Promise<boolean> => {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('Valid guest ID is required');
    }

    return withRetry(async () => {
      const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    });
  }
};
