# GPHA Bus Tracker — Claude Code Agent Guide

## Project Overview
A real-time bus tracking web app for Ghana Ports and Harbours Authority (GPHA) staff.
Built by the GPHA IT department as an internal tool. Zero cost infrastructure. Staff use it
to track 4 company buses and get notified when their bus is approaching their stop.

**Developer:** Edwin Idan (GPHA IT) + team contributors
**Editor:** Google Antigravity
**Agent:** Claude Code

---

## Tech Stack

| Layer | Tool | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | PWA — installable on phones |
| Styling | Tailwind CSS | Utility first |
| Map | Leaflet.js | Free, open source |
| Database | Supabase (Postgres) | Free tier |
| Realtime | Supabase Realtime | Live location broadcasts |
| Backend functions | Supabase Edge Functions | Geofence checks |
| Notifications | Web Push API + Service Workers | No app install needed |
| GPS | Browser Geolocation API | navigator.geolocation |
| Hosting | Vercel | Free tier, deploy from GitHub |
| Language | TypeScript | Strict mode on |

---

## Buses and Routes

| Bus | Route | Tracker PIN |
|---|---|---|
| Bus A | Shama | 1001 |
| Bus B | Anaji | 1002 |
| Bus C | Sekondi | 1003 |
| Bus D | Biaho | 1004 |

> Stops along each route are stored in the database and will be added later via the admin page.
> Do NOT hardcode stop data anywhere in the codebase.

---

## Project Structure

```
gpha-bus-tracker/
├── app/
│   ├── page.tsx                  # Staff map view (home)
│   ├── track/page.tsx            # Tracker page (driver/passenger)
│   ├── admin/page.tsx            # Admin — manage buses and stops
│   └── api/
│       └── push/route.ts         # Web push notification endpoint
├── components/
│   ├── Map.tsx                   # Leaflet map component
│   ├── BusMarker.tsx             # Colored bus dot on map
│   ├── BusSelector.tsx           # Staff picks their bus/stop
│   └── TrackerForm.tsx           # PIN entry + start tracking UI
├── lib/
│   ├── supabase.ts               # Supabase client (browser)
│   ├── supabase-server.ts        # Supabase client (server)
│   ├── geofence.ts               # Geofence distance calculation
│   ├── offline-buffer.ts         # localStorage ping queue
│   └── push.ts                  # Web push subscription helpers
├── public/
│   └── sw.js                     # Service worker for push notifications
├── types/
│   └── index.ts                  # Shared TypeScript types
├── .env.local                    # Never commit this
├── .gitignore
├── CLAUDE.md                     # This file
└── README.md
```

---

## Database Schema (Supabase)

### `buses`
```sql
id          uuid primary key
name        text           -- "Bus A"
route       text           -- "Shama"
pin         text           -- hashed PIN
color       text           -- hex color for map marker
active      boolean        -- is this bus currently running
created_at  timestamptz
```

### `locations`
```sql
id          uuid primary key
bus_id      uuid references buses(id)
latitude    float8
longitude   float8
accuracy    float4
created_at  timestamptz    -- index this column
```

### `stops`
```sql
id          uuid primary key
bus_id      uuid references buses(id)
name        text
latitude    float8
longitude   float8
order_index integer        -- stop sequence along route
geofence_radius_meters integer  -- default 300
```

### `push_subscriptions`
```sql
id          uuid primary key
bus_id      uuid references buses(id)
stop_id     uuid references stops(id)
endpoint    text
p256dh      text
auth        text
created_at  timestamptz
```

---

## Key Constraints and Rules

### Offline buffer (critical)
- There is NO mobile internet on the bus routes
- The tracker page MUST buffer GPS pings in localStorage when offline
- Flush the buffer to Supabase the moment `navigator.onLine` becomes true
- Buffer key: `gpha_ping_buffer`
- Max buffer size: 500 pings (drop oldest if exceeded)
- Ping interval: every 10 seconds when online, every 30 seconds when offline

### GPS tracking
- Always use `navigator.geolocation.watchPosition` not `getCurrentPosition`
- Request high accuracy: `{ enableHighAccuracy: true, timeout: 10000 }`
- Ignore pings with accuracy worse than 50 meters
- Stop watching when the tracker tab is closed (cleanup in useEffect return)

### PIN validation
- Never store raw PINs in the database — hash with bcrypt
- PIN entry screen should not reveal which bus a PIN belongs to on failure
- After 5 wrong attempts, lock for 10 minutes (client-side is fine for MVP)

### Map
- Center map on Takoradi on load: `{ lat: 4.8977, lng: -1.7553 }`
- Default zoom: 12
- Each bus has a fixed color (set in the buses table)
- Show last known location if bus is not currently tracking (grayed out marker)
- Leaflet must be dynamically imported (no SSR) — use `dynamic()` with `ssr: false`

### Realtime
- Staff map subscribes to `locations` table inserts filtered by `bus_id`
- Only keep the latest location per bus in the UI state — do not accumulate history
- Unsubscribe on component unmount

### Notifications (Phase 2 — do not build until stops are added)
- Geofence radius is stored per stop in the database
- Check geofence in a Supabase Edge Function triggered on location insert
- Use Web Push API — endpoint at `/api/push`

---

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # server only, never expose to client
NEXT_PUBLIC_MAP_CENTER_LAT=4.8977
NEXT_PUBLIC_MAP_CENTER_LNG=-1.7553
VAPID_PUBLIC_KEY=                # for web push (Phase 2)
VAPID_PRIVATE_KEY=               # for web push (Phase 2)
```

---

## Build Phases

### Phase 1 (current) — Core tracking
- [ ] Supabase schema setup
- [ ] Tracker page — PIN entry, GPS watching, offline buffer, live pings
- [ ] Staff map page — live Leaflet map, all 4 buses, realtime updates
- [ ] Bus selector — staff picks their bus, stored in localStorage
- [ ] Admin page — add/edit stops and buses (protected by simple password)

### Phase 2 — Notifications and ETA
- [ ] Geofence edge function
- [ ] Web push subscription flow
- [ ] Push notification on bus approach
- [ ] ETA calculation based on route position

### Phase 3 — Polish
- [ ] PWA manifest + install prompt
- [ ] Offline fallback page
- [ ] Historical route replay (admin only)
- [ ] Vercel cron to keep Supabase free tier alive (ping every 3 days)

---

## Commands

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Type check
npm run type-check

# Build for production
npm run build
```

---

## Git Workflow

- `main` — production branch, deploys to Vercel automatically
- `dev` — active development branch
- Feature branches: `feature/tracker-page`, `feature/live-map`, etc.
- Never commit `.env.local`
- Commit messages: lowercase, imperative — `add tracker pin validation`

---

## Notes for Agent

- This is an internal GPHA tool. Keep UI clean and simple — staff are not all technical.
- Mobile-first design. Most staff will use this on their phones.
- Takoradi, Ghana is the location context for all map defaults.
- The app must work on low-end Android phones with slow connections.
- Do not over-engineer. MVP first, polish later.
- When in doubt about a feature, check the phases above before building.
