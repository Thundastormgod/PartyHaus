# API Reference — PartyHaus (one-page)

This file documents the external endpoints and Supabase interactions used by the frontend.

1) Local backend endpoints

- POST /api/send-email
  - URL: http://localhost:3001/api/send-email
  - Body (JSON): { to: string, subject: string, html: string }
  - Response: { success: boolean, data?: any, error?: string }
  - Client: `src/lib/email.ts` (now wrapped by `src/api/sendEmail.ts`)

2) Supabase Auth (SDK methods used)

- signInWithPassword({ email, password }) — sign in
- signUp({ email, password, options? }) — sign up
- signOut() — sign out
- getSession() — get current session
- getUser() — get current user
- resetPasswordForEmail(email, opts) — reset password flow
- onAuthStateChange(handler) — listen for auth events

Files: `src/hooks/use-auth.ts`, `src/lib/auth.ts`

3) Supabase Table CRUD

- events
  - getUserEvents(userId): SELECT * FROM events WHERE host_id = userId
  - createEvent(event): INSERT INTO events
  - updateEvent(id, updates): UPDATE events WHERE id = id
  - deleteEvent(id): DELETE FROM events WHERE id = id
  - File: `src/lib/events.ts`

- guests
  - getEventGuests(eventId): SELECT * FROM guests WHERE event_id = eventId
  - addGuest(guest): INSERT INTO guests
  - updateGuest(id, updates): UPDATE guests WHERE id = id
  - removeGuest(id): DELETE FROM guests WHERE id = id
  - File: `src/lib/events.ts`

4) Realtime channels (Supabase)

- Channel `events-changes`: postgres_changes on table `events`, filter `host_id=eq.<user.id>`
- Channel `guests-changes`: postgres_changes on table `guests`, filters `event_id=eq.<eventId>` for INSERT and UPDATE events
- File: `src/hooks/use-realtime.ts`

5) Client routing states (Zustand-driven)

- `auth` — Authentication screen (`src/components/AuthScreen.tsx`)
- `dashboard` — Dashboard (`src/components/Dashboard.tsx`)
- `create-event`, `event-management`, `qr-scanner`, and `guest-view-<id>` — other app pages
- Controlled by `currentPage` in `src/store/usePartyStore.ts`

Example request (send-email):

POST http://localhost:3001/api/send-email
Headers: Content-Type: application/json
Body:
{
  "to": "person@example.com",
  "subject": "You're invited!",
  "html": "<p>Event details here</p>"
}

---
If you want this converted into a Postman collection or OpenAPI snippet, say so and I'll add it.
