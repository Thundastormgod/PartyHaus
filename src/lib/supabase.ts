// DEV ONLY: Clear Supabase session on app load to force manual login
if (import.meta.env.DEV) {
  try {
    const keys = Object.keys(localStorage).filter(k => k.includes('supabase.auth'));
    for (const k of keys) {
      localStorage.removeItem(k);
  // ...removed bloatware debug log...
    }
  } catch (e) {
    // ignore if localStorage is not available
  }
}
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  // Warn instead of throwing so the dev server and HMR don't completely break
  // This allows the app to render and show an in-app error state instead.
  // Developers should set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.
  // eslint-disable-next-line no-console
  // ...removed bloatware warning log...
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for our database tables
export type Tables = {
  events: {
    id: string;
    host_id: string;
    name: string;
    event_date: string;
    location: string;
    spotify_playlist_url: string;
    active_game_id: string | null;
    created_at: string;
  };
  guests: {
    id: string;
    event_id: string;
    name: string;
    email: string;
    is_checked_in: boolean;
    created_at: string;
  };
  games: {
    id: string;
    event_id: string;
    type: string;
    settings: Record<string, unknown>;
    content: Record<string, unknown>;
    order_index: number;
    created_at: string;
  };
  game_sessions: {
    id: string;
    game_id: string;
    status: 'pending' | 'active' | 'completed';
    current_round: number;
    scores: Record<string, number>;
    created_at: string;
    updated_at: string;
  };
};
