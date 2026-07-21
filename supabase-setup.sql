-- ============================================================
-- Run this once in your Supabase project: SQL Editor > New query > Run
-- ============================================================

-- 1. Table that stores every booked slot
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null,
  court_id int not null,
  booking_date date not null,
  start_time time not null,
  customer_name text not null,
  contact_number text not null,
  email text not null,
  proof_url text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- 2. Prevent two people from ever holding the same court/date/time
--    (ignores cancelled bookings, so a cancelled slot frees up again)
create unique index if not exists unique_active_slot
  on bookings (court_id, booking_date, start_time)
  where status <> 'cancelled';

-- 3. Row Level Security: turn on, then allow the public site to read + create
alter table bookings enable row level security;

create policy "Public can view bookings"
  on bookings for select
  using (true);

create policy "Public can create a booking"
  on bookings for insert
  with check (true);

-- Admin dashboard confirms / cancels using the same public key (see README
-- security note), so it also needs update rights:
create policy "Public can update bookings"
  on bookings for update
  using (true);

-- 4. Storage bucket for payment-proof screenshots
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', true)
on conflict (id) do nothing;

create policy "Public can upload payment proof"
  on storage.objects for insert
  with check (bucket_id = 'payment-proofs');

create policy "Public can view payment proof"
  on storage.objects for select
  using (bucket_id = 'payment-proofs');
