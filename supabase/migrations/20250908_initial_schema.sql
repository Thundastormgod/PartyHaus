-- Initial schema setup
create extension if not exists "uuid-ossp";

-- Events table
create table if not exists public.events (
    id uuid primary key default uuid_generate_v4(),
    host_id uuid references auth.users(id) not null,
    name text not null,
    event_date timestamp with time zone not null,
    location text not null,
    spotify_playlist_url text,
    active_game_id uuid,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Guests table
create table if not exists public.guests (
    id uuid primary key default uuid_generate_v4(),
    event_id uuid references events(id) on delete cascade not null,
    name text not null,
    email text not null,
    is_checked_in boolean default false,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Basic RLS policies
alter table public.events enable row level security;
alter table public.guests enable row level security;

-- Events policies
create policy "Users can view their own events"
    on public.events for select
    using (auth.uid() = host_id);

create policy "Users can create their own events"
    on public.events for insert
    with check (auth.uid() = host_id);

create policy "Users can update their own events"
    on public.events for update
    using (auth.uid() = host_id);

create policy "Users can delete their own events"
    on public.events for delete
    using (auth.uid() = host_id);

-- Guests policies
create policy "Users can view guests of their events"
    on public.guests for select
    using (exists (
        select 1 from events
        where events.id = guests.event_id
        and events.host_id = auth.uid()
    ));

create policy "Users can manage guests of their events"
    on public.guests for all
    using (exists (
        select 1 from events
        where events.id = guests.event_id
        and events.host_id = auth.uid()
    ));
