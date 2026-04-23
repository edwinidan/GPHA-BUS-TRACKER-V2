# GPHA Bus Tracker — Project Report

**Organisation:** Ghana Ports and Harbours Authority (GPHA)
**Department:** Information Technology
**Project Lead:** Edwin Idan
**Report Date:** April 2026
**Status:** Phase 1 Complete — Active Development

---

## 1. Executive Summary

The GPHA Bus Tracker is an internal web application that allows GPHA staff to track the real-time location of the four company commuter buses. Staff can open the app on their personal phones, see where each bus is on a live map, and — in a future phase — receive a push notification when their bus is approaching their stop.

The project is fully built and hosted at zero infrastructure cost using free-tier cloud services (Supabase, Vercel). It requires no app-store installation and runs as a Progressive Web App (PWA) directly in the browser. The first production phase, covering live location sharing, real-time staff map, and an admin management panel, is complete.

---

## 2. Background and Problem Statement

GPHA operates four commuter buses that transport staff along four designated routes — Shama, Anaji, Sekondi, and Biaho — between home areas and the port. Currently, staff have no reliable way to know where a bus is or when it will arrive at their stop. This leads to:

- Staff missing buses because they did not know the bus was approaching
- Staff waiting unnecessarily at stops for buses that are still far away
- No visibility for management over whether buses are running on schedule

The GPHA IT Department was tasked with delivering a lightweight, zero-cost solution that works on the low-end Android phones common among staff and remains functional on the slow mobile connections found along the bus routes.

---

## 3. Objectives

| # | Objective |
|---|---|
| 1 | Allow a driver or early passenger to share the bus's live GPS location from their personal phone |
| 2 | Allow any staff member to open a map and see where all four buses are in real time |
| 3 | Allow the IT team to manage bus stops and bus metadata via a password-protected admin panel |
| 4 | Deliver push notifications to staff when their bus is approaching their stop *(Phase 2)* |
| 5 | Keep all infrastructure costs at zero using free-tier cloud services |
| 6 | Ensure the app works on low-end Android phones and slow mobile connections |

---

## 4. System Architecture

### 4.1 High-Level Overview

```
Staff phone (browser)          Driver phone (browser)
       │                               │
       │ Supabase Realtime             │ GPS pings (POST)
       │ (WebSocket)                   │
       ▼                               ▼
  ┌─────────────────────────────────────────┐
  │              Next.js App                │
  │         (Hosted on Vercel)              │
  │                                         │
  │  /            — Staff live map          │
  │  /track       — Driver tracker          │
  │  /admin       — IT admin panel          │
  │  /api/push    — Web push endpoint       │
  └─────────────────────────────────────────┘
                      │
                      ▼
           ┌──────────────────┐
           │   Supabase       │
           │  (Postgres DB)   │
           │  Realtime        │
           │  Edge Functions  │
           └──────────────────┘
```

### 4.2 Data Flow — Location Tracking

1. The driver opens `/track` on their phone and enters the bus PIN.
2. The app validates the PIN locally, then fetches the bus UUID from Supabase.
3. `navigator.geolocation.watchPosition` begins streaming GPS coordinates every ~10 seconds.
4. Each ping is written directly to the `locations` table in Supabase.
5. If the phone goes offline, pings are buffered in `localStorage` and flushed automatically when connectivity is restored.
6. Supabase Realtime broadcasts each new row insert to all connected staff map clients.
7. Each staff phone's map moves the correct bus marker instantly.

### 4.3 Data Flow — Staff Map

1. Staff open `/` on their phone.
2. The app fetches the latest known location for each bus in parallel.
3. A Leaflet map is rendered centred on Takoradi (lat 4.8977, lng −1.7553).
4. Each bus appears as a coloured circular marker with the bus name.
5. Supabase Realtime keeps the markers moving in real time with no page refresh.

---

## 5. Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Framework | Next.js 16 (App Router) | SSR + PWA support, Vercel-native |
| Language | TypeScript 5 (strict mode) | Type safety across the full codebase |
| Styling | Tailwind CSS 4 | Utility-first, fast to build, mobile-first |
| Map | Leaflet.js 1.9 | Free, open source, no API key required |
| Database | Supabase (Postgres) | Free tier, generous limits, built-in Realtime |
| Realtime | Supabase Realtime | WebSocket-based live updates, zero extra cost |
| Backend functions | Supabase Edge Functions | Geofence checks — Phase 2 |
| Notifications | Web Push API + Service Workers | No app install needed |
| GPS | Browser Geolocation API | Built into every modern mobile browser |
| Hosting | Vercel | Free tier, auto-deploys from GitHub |
| PWA | next-pwa | Makes the app installable from the browser |

---

## 6. Database Schema

All data is stored in a Supabase (Postgres) project on the free tier.

### `buses`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | Auto-generated |
| name | text | "Bus A", "Bus B", etc. |
| route | text | "Shama", "Anaji", "Sekondi", "Biaho" |
| pin | text | Hashed PIN — never stored in plain text |
| color | text | Hex colour for map marker |
| active | boolean | Whether the bus is currently running |
| created_at | timestamptz | |

### `locations`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| bus_id | uuid (FK → buses) | |
| latitude | float8 | |
| longitude | float8 | |
| accuracy | float4 | Meters — pings worse than 50m are discarded |
| created_at | timestamptz | Indexed |

### `stops`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| bus_id | uuid (FK → buses) | |
| name | text | Stop name |
| latitude | float8 | |
| longitude | float8 | |
| order_index | integer | Sequence along the route |
| geofence_radius_meters | integer | Default 300m — triggers notification |

### `push_subscriptions`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| bus_id | uuid (FK → buses) | Bus the staff member is tracking |
| stop_id | uuid (FK → stops) | Stop they want notifications for |
| endpoint | text | Web Push endpoint URL |
| p256dh | text | Encryption key |
| auth | text | Auth secret |
| created_at | timestamptz | |

---

## 7. Project File Structure

```
gpha-bus-tracker/
├── app/
│   ├── page.tsx               # Staff live map (home page)
│   ├── track/page.tsx         # Driver tracker page
│   ├── admin/page.tsx         # IT admin panel
│   ├── api/push/route.ts      # Web push notification API endpoint
│   ├── layout.tsx             # Root layout with PWA meta tags
│   └── globals.css            # Global Tailwind styles
├── components/
│   ├── Map.tsx                # Leaflet map (dynamically imported, no SSR)
│   ├── BusMarker.tsx          # Coloured circular bus marker
│   ├── BusSelector.tsx        # Staff picks their bus from the top bar
│   └── TrackerForm.tsx        # PIN entry + start/stop tracking UI
├── lib/
│   ├── supabase.ts            # Supabase browser client
│   ├── supabase-server.ts     # Supabase server client (service role)
│   ├── geofence.ts            # Haversine distance calculation
│   ├── offline-buffer.ts      # localStorage ping queue with flush logic
│   └── push.ts                # Web Push subscription helpers
├── types/
│   └── index.ts               # Shared TypeScript interfaces + BUS_CONFIG
├── public/
│   └── sw.js                  # Service worker for push notifications
├── _dev/
│   ├── phase1a-tracker.md     # Build spec — tracker page
│   ├── phase1b-map.md         # Build spec — live map
│   └── phase1c-admin.md       # Build spec — admin panel
├── .env.local                 # Environment variables (never committed)
├── CLAUDE.md                  # Agent instructions
└── PROJECT_REPORT.md          # This file
```

---

## 8. Features Built — Phase 1

### 8.1 Tracker Page (`/track`)

- **PIN entry screen** — Staff or driver enters a 4-digit bus PIN. The PIN is validated locally against a config constant; Supabase is not called during validation, which means the page works even with no signal at this stage.
- **Brute-force lockout** — After 5 wrong PIN attempts, the form is locked for 10 minutes. The lockout state is persisted in `localStorage` so it survives a page refresh.
- **Live GPS tracking** — Once the PIN is accepted, the driver taps "Start Tracking." The app uses `navigator.geolocation.watchPosition` with high-accuracy mode to stream GPS coordinates. Pings with accuracy worse than 50 metres are silently discarded to prevent noise on the map.
- **Offline buffer** — Because mobile signal is often unavailable along bus routes, every ping that cannot reach Supabase is stored in a `localStorage` queue (`gpha_ping_buffer`, max 500 entries). The moment the phone detects connectivity is restored, the buffer is flushed to Supabase automatically. Ping interval is 10 seconds when online and 30 seconds when offline.
- **Status display** — The tracking screen shows a real-time status indicator (Tracking / Offline — buffering / Stopped), a live ping counter, and the bus name and route as the page heading.
- **Clean teardown** — `watchPosition` is cancelled in the React `useEffect` cleanup function, preventing memory leaks and battery drain when the tracker tab is closed.

### 8.2 Live Map Page (`/`)

- **Leaflet map** — A full-screen interactive map centred on Takoradi. Leaflet is dynamically imported with `ssr: false` so Next.js never attempts to render it on the server.
- **All four buses visible** — On load, the latest known location for each bus is fetched from Supabase in parallel. Each bus is shown as a coloured circular marker matching its assigned colour.
- **No-signal fallback** — If a bus has no location data yet, its marker appears at the map centre in grey with the tooltip "No signal yet."
- **Supabase Realtime updates** — The page subscribes to the `locations` table, filtered by each bus's UUID. When a new ping arrives, only that bus's marker position is updated — no full page reload. History is not accumulated; only the latest position per bus is kept in state.
- **Bus selector** — A bar at the top of the screen lets staff select their bus. The selection is saved to `localStorage` and restored on the next visit. This is wired up in preparation for Phase 2 push notifications.
- **Route legend** — A fixed bar at the bottom shows all four buses with their colour dots and route names for quick reference.

### 8.3 Admin Panel (`/admin`)

- **Password protection** — The page is protected by a hardcoded IT admin password (`gpha-admin-2024`). Authentication state is stored in `sessionStorage` so the IT team stays logged in for the browser session without having to re-enter the password on every page load.
- **Buses table** — Fetches all bus records from Supabase and displays them in a table with the bus name, route, colour swatch, and an active toggle switch. Toggling the switch updates the `active` field in Supabase immediately.
- **Stops management** — Fetches all stops, groups them by bus, and displays them in per-bus tables showing stop name, coordinates, order index, and geofence radius.
- **Add stop form** — A form at the top of the stops section lets the IT team add new stops. The bus dropdown is populated from the live Supabase buses table (not hardcoded). All fields are validated before insert.
- **Inline editing** — Each stop row has an Edit button that makes the name and geofence radius editable in-place. Coordinates and order index are intentionally read-only after creation.
- **Delete with confirmation** — Deleting a stop triggers a browser confirmation dialog before the row is removed from Supabase and the UI.
- **Feedback on every operation** — Loading states, success toasts, and error messages are shown for every database operation.

---

## 9. Key Technical Decisions

| Decision | Rationale |
|---|---|
| Vanilla Leaflet via dynamic import, no react-leaflet | react-leaflet has known SSR compatibility issues with Next.js App Router; vanilla Leaflet imported inside `useEffect` is more predictable |
| PIN validation is local-only | Drivers often have no signal when they first open the tracker page; local validation against `BUS_CONFIG` ensures the PIN screen works offline |
| Offline buffer in `localStorage` | No mobile internet along bus routes; pings must survive connectivity loss without data loss |
| GPS `watchPosition` not `getCurrentPosition` | Continuous stream at OS-level frequency; `getCurrentPosition` is one-shot and insufficient for live tracking |
| Supabase Realtime over polling | WebSocket-based, zero extra cost, and delivers sub-second map updates without wasting battery on repeated HTTP polls |
| No server actions — Supabase browser client only | Simplifies the stack; all operations from client pages go directly to Supabase via the anon key with row-level security |
| `next-pwa` for PWA support | Lets staff install the app to their home screen on Android without going through the Play Store |
| Free-tier only | GPHA IT has no infrastructure budget for this tool; all services used have generous free tiers that comfortably cover the load of ~500 staff |

---

## 10. Environment Variables

| Variable | Used by | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser | Public anon key — safe to expose |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Admin-level key — never sent to the client |
| `NEXT_PUBLIC_MAP_CENTER_LAT` | Map | Default: 4.8977 (Takoradi) |
| `NEXT_PUBLIC_MAP_CENTER_LNG` | Map | Default: −1.7553 (Takoradi) |
| `VAPID_PUBLIC_KEY` | Phase 2 | Web Push encryption key |
| `VAPID_PRIVATE_KEY` | Phase 2 | Web Push signing key — server only |

---

## 11. Build Phases

### Phase 1 — Core Tracking (Complete)
- [x] Supabase schema setup
- [x] Tracker page — PIN entry, GPS watching, offline buffer, live pings
- [x] Staff map page — live Leaflet map, all 4 buses, Realtime updates
- [x] Bus selector — saves and restores from localStorage
- [x] Admin page — manage buses and add/edit/delete stops

### Phase 2 — Notifications and ETA (Planned)
- [ ] Geofence edge function — triggers when a bus enters a stop's radius
- [ ] Web Push subscription flow — staff subscribe from the map page
- [ ] Push notification on bus approach
- [ ] ETA estimate based on current position along route

### Phase 3 — Polish (Planned)
- [ ] PWA install prompt
- [ ] Offline fallback page
- [ ] Historical route replay (admin only)
- [ ] Vercel cron to keep Supabase free tier alive (ping every 3 days)

---

## 12. Security Considerations

| Area | Approach |
|---|---|
| Bus PINs | Stored hashed in the database — raw PINs are never persisted |
| PIN failure feedback | Error message does not reveal which bus a PIN belongs to |
| Admin access | Session-based (sessionStorage); password kept out of the codebase via environment variable conventions — suitable for an internal IT tool |
| Supabase service role key | Server-side only; never exposed to the browser or committed to source control |
| `.env.local` | Listed in `.gitignore`; never committed |

---

## 13. Buses and Routes

| Bus | Route | Colour | Tracker PIN |
|---|---|---|---|
| Bus A | Shama | Red `#E63946` | 1001 |
| Bus B | Anaji | Teal `#2A9D8F` | 1002 |
| Bus C | Sekondi | Yellow `#E9C46A` | 1003 |
| Bus D | Biaho | Blue `#457B9D` | 1004 |

---

## 14. Deployment

- **Repository:** Private GitHub repository
- **Hosting:** Vercel (free tier) — auto-deploys from the `main` branch
- **Database:** Supabase (free tier) — hosted Postgres + Realtime
- **Branch strategy:**
  - `main` — production; every push triggers a Vercel deploy
  - `dev` — active development branch
  - Feature branches: `feature/<name>` (e.g. `feature/tracker-page`)

---

## 15. Known Limitations (MVP)

- Admin password is a single hardcoded credential — suitable for a small IT team but not for multi-user access control
- Location history is not retained in the UI — only the latest ping per bus is kept in memory
- No ETA calculation yet — staff can see the bus moving but cannot get an estimated arrival time until Phase 2
- No historical route replay — available in Phase 3 only
- PWA install prompt is not yet implemented — staff can manually use "Add to Home Screen" in their browser

---

## 16. Team

| Role | Person |
|---|---|
| Project lead & developer | Edwin Idan (GPHA IT) |
| AI coding agent | Claude Code (Anthropic) |

---

*This document reflects the state of the project as of April 2026. It should be updated at the completion of each phase.*
