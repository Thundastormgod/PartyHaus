LLM Prompt: Build the "PartyHaus" React.js MVP with Interactive Gaming Features
1. Core Objective & Persona
Act as an expert full-stack developer specializing in modern React.js applications. Your mission is to build a functional Minimum Viable Product (MVP) for "PartyHaus," a web app for planning interactive parties with integrated party games. The UI must be sleek, modern, mobile-first, and highly animated to provide a premium user experience.

2. Mandatory Technology Stack
You must use the following technologies precisely as specified:

Frontend: React.js (with functional components and Hooks)
Backend (BaaS): Supabase for authentication, database (PostgreSQL), and real-time features
State Management: Zustand for simple, centralized client-side state
Styling: Tailwind CSS for all styling. Implement a clean, dark theme
Animation: Framer Motion for all page transitions, component animations, and interactive feedback
QR Code Functionality:
- qrcode.react for generating guest QR codes
- react-qr-reader for the host's scanning functionality
AR/Interactive Features:
- react-webcam for AR features and camera integration
- canvas API for drawing games
- Web Audio API for sound-based games

3. MVP Feature Set & Logic Implementation
The MVP covers the complete lifecycle of creating and managing a party from the host's perspective and the check-in process from the guest's perspective.

User Flow 1: The Party Host
Authentication:

A user must be able to sign up and log in using email and password.

Implement logic using supabase.auth.signUp and supabase.auth.signInWithPassword.

Upon successful authentication, the user's session should be managed in the Zustand store, and they should be redirected to their dashboard.

Event Dashboard:

After logging in, the host sees a list of all events they have created.

This screen should fetch and display data from the Supabase events table, filtered by the logged-in host's user ID.

Include a prominent "Create New Event" button.

Event Creation:

Implement a form that allows the host to input: Event Name, Date/Time, Location, and a public URL for a Spotify Collaborative Playlist.

On submission, this form should insert a new record into the events table in Supabase.

Event Management View:

This is the host's main control panel for a specific event.

Guest List: Fetch and display all guests associated with the event from the guests table. For each guest, show their name, email, and a real-time is_checked_in status (e.g., "Pending" or "Checked-In").

Real-Time Updates: Implement a Supabase real-time subscription to the guests table. When a guest's is_checked_in status changes, the UI must update automatically without a page refresh.

Add Guests: Include a form for the host to add guests by name and email. Submitting this form should insert a new record into the guests table, linking it to the current event.

QR Scanner: A "Scan Guest QR Code" button should navigate to the scanning interface.

Playlist Display: Embed the Spotify playlist using an <iframe> and the URL provided during event creation.

QR Code Scanning:

This screen must activate the device's camera using the react-qr-reader component.

Upon successfully scanning a QR code, extract the guestId from the scanned data.

Immediately make a call to Supabase to update the corresponding record in the guests table, setting is_checked_in to true.

Provide clear success/error feedback to the host.

User Flow 2: The Party Guest
Invitation Access: The guest will access the app via a unique URL provided by the host (e.g., /event/{eventId}/guest/{guestId}). Your app must be able to parse these parameters from the URL to identify the event and the specific guest.

Guest Event View:

This view should display the key event details (Name, Date, Location).

It should also show the embedded Spotify playlist.

Include a primary call-to-action button: "Show My QR Code".

QR Code Display:

When clicked, this view should prominently display the guest's unique QR code on the screen.

Generate this QR code using the qrcode.react component. The data encoded in the QR code must be the guest's unique id from the Supabase guests table.

4. Data & State Structure

Supabase Schema

events table:
- id (uuid, Primary Key)
- host_id (uuid, Foreign Key to auth.users.id)
- name (text)
- event_date (timestamp)
- location (text)
- spotify_playlist_url (text)
- active_game_id (uuid, nullable)

guests table:
- id (uuid, Primary Key)
- event_id (uuid, Foreign Key to events.id)
- name (text)
- email (text)
- is_checked_in (boolean, default false)

games table:
- id (uuid, Primary Key)
- event_id (uuid, Foreign Key to events.id)
- type (text)
- settings (jsonb)
- content (jsonb)
- order_index (integer)

game_sessions table:
- id (uuid, Primary Key)
- game_id (uuid, Foreign Key to games.id)
- status (text)
- current_round (integer)
- scores (jsonb)

Zustand Store Structure:
- user: Current authenticated user object
- currentEvent: Active event details
- guests: Array of event guests
- activeGame: Current game state
- gameSession: Active gameplay session data
- scores: Real-time scoring data

5. Implementation Requirements

Code Organization:
- Component-based architecture
- Custom hooks for game logic
- Shared UI components
- Game template system

State Management:
- Zustand for global state
- React Query for server state
- Real-time subscriptions for game updates

UI/UX Requirements:
- Mobile-first design
- Smooth animations
- Clear feedback systems
- Error handling
- Loading states

Performance Considerations:
- Optimized real-time updates
- Efficient rendering
- Asset preloading
- Offline support

Testing Requirements:
- Unit tests for game logic
- Integration tests for real-time features
- UI component testing
- Performance monitoring

This enhanced MVP combines traditional party management features with an engaging gaming platform, creating a unique value proposition in the event management space. The gaming features are designed to be both technically feasible and engaging, while maintaining the core functionality of party management.