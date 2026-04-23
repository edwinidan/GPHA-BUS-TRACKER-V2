-- GPHA Bus Tracker — Supabase Schema
-- Run this manually in the Supabase SQL editor to initialise all tables.
-- Do NOT run this automatically from application code.

-- ============================================================
-- buses
-- One row per company bus. Color is a hex string used for the map marker.
-- ============================================================
create table if not exists buses (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null,        -- e.g. "Bus A"
  route       text        not null,        -- e.g. "Shama"
  pin         text        not null,        -- bcrypt-hashed PIN
  color       text        not null,        -- hex color, e.g. "#E63946"
  active      boolean     not null default false,
  created_at  timestamptz not null default now()
);

-- Seed the 4 GPHA buses (PINs must be replaced with bcrypt hashes before use)
-- insert into buses (name, route, pin, color) values
--   ('Bus A', 'Shama',   '<hashed-1001>', '#E63946'),
--   ('Bus B', 'Anaji',   '<hashed-1002>', '#2A9D8F'),
--   ('Bus C', 'Sekondi', '<hashed-1003>', '#E9C46A'),
--   ('Bus D', 'Biaho',   '<hashed-1004>', '#457B9D');

-- ============================================================
-- locations
-- GPS pings sent by the tracker. One row per ping.
-- Index on created_at for fast "latest location per bus" queries.
-- ============================================================
create table if not exists locations (
  id          uuid primary key default gen_random_uuid(),
  bus_id      uuid        not null references buses(id) on delete cascade,
  latitude    float8      not null,
  longitude   float8      not null,
  accuracy    float4      not null,
  created_at  timestamptz not null default now()
);

create index if not exists locations_created_at_idx on locations (created_at desc);
create index if not exists locations_bus_id_idx on locations (bus_id);

-- ============================================================
-- stops
-- Bus stops along each route. Added via the admin page — never hardcoded.
-- geofence_radius_meters defaults to 300 m.
-- ============================================================
create table if not exists stops (
  id                      uuid    primary key default gen_random_uuid(),
  bus_id                  uuid    not null references buses(id) on delete cascade,
  name                    text    not null,
  latitude                float8  not null,
  longitude               float8  not null,
  order_index             integer not null,   -- stop sequence along the route
  geofence_radius_meters  integer not null default 300
);

-- ============================================================
-- push_subscriptions
-- Web Push API subscription objects — Phase 2.
-- One row per device/stop combination.
-- ============================================================
create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  bus_id      uuid not null references buses(id)  on delete cascade,
  stop_id     uuid not null references stops(id)  on delete cascade,
  endpoint    text not null,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);
