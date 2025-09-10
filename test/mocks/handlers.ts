import { rest } from 'msw';
import { supabase } from '../../src/lib/supabase';

// Simple handler for events endpoints used by eventService
export const handlers = [
  rest.get(`${process.env.VITE_SUPABASE_URL}/rest/v1/events`, (req, res, ctx) => {
    const id = req.url.searchParams.get('id');
    if (id === 'test-event-1') {
      return res(ctx.status(200), ctx.json([{ id: 'test-event-1', host_id: 'u1', name: 'Test Event', event_date: '2025-09-10T20:00:00Z', location: 'Nowhere', spotify_playlist_url: '' }]));
    }
    return res(ctx.status(200), ctx.json([]));
  })
];
