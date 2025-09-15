-- Complete production database setup with fixed UUID functions
-- This migration safely applies all remaining schema changes

-- Ensure pgcrypto extension for gen_random_uuid()
create extension if not exists "pgcrypto";

-- Update events table for modern schema if needed
do $$
begin
    -- Add new columns for multi-day events if they don't exist
    if not exists (select 1 from information_schema.columns where table_name = 'events' and column_name = 'start_date') then
        alter table events add column start_date timestamp with time zone;
        -- Migrate existing data
        update events set start_date = event_date where start_date is null;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'events' and column_name = 'end_date') then
        alter table events add column end_date timestamp with time zone;
        -- For single day events, end_date equals start_date
        update events set end_date = coalesce(start_date, event_date) where end_date is null;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'events' and column_name = 'event_type') then
        alter table events add column event_type text default 'single_day' check (event_type in ('single_day', 'multi_day'));
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'events' and column_name = 'invite_image_url') then
        alter table events add column invite_image_url text;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'events' and column_name = 'max_guests') then
        alter table events add column max_guests integer;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'events' and column_name = 'is_public') then
        alter table events add column is_public boolean default false;
    end if;
end $$;

-- Add email tracking columns to guests if they don't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'guests' and column_name = 'email_status') then
        alter table guests add column email_status text default 'not_sent' check (email_status in ('not_sent', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'));
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'guests' and column_name = 'last_email_sent_at') then
        alter table guests add column last_email_sent_at timestamp with time zone;
    end if;
end $$;

-- Create or update email analytics view
create or replace view email_analytics as
select 
    e.id as event_id,
    e.name as event_name,
    count(el.id) as total_emails_sent,
    count(case when el.status = 'delivered' then 1 end) as delivered_count,
    count(case when el.status = 'opened' then 1 end) as opened_count,
    count(case when el.status = 'clicked' then 1 end) as clicked_count,
    count(case when el.status = 'bounced' then 1 end) as bounced_count,
    count(case when el.status = 'failed' then 1 end) as failed_count,
    round(
        (count(case when el.status = 'delivered' then 1 end)::numeric / 
         nullif(count(el.id), 0) * 100), 2
    ) as delivery_rate,
    round(
        (count(case when el.status = 'opened' then 1 end)::numeric / 
         nullif(count(case when el.status = 'delivered' then 1 end), 0) * 100), 2
    ) as open_rate,
    round(
        (count(case when el.status = 'clicked' then 1 end)::numeric / 
         nullif(count(case when el.status = 'opened' then 1 end), 0) * 100), 2
    ) as click_rate
from events e
left join email_logs el on e.id = el.event_id
group by e.id, e.name;