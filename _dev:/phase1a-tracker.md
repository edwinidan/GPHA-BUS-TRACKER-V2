# Phase 1a — Tracker Page

Read CLAUDE.md carefully before starting. Build only what is described in this file.

---

## GOAL
Build the tracker page at `app/track/page.tsx`. This is the page the driver or an early passenger opens on their personal phone to share the bus location in real time.

---

## FLOW

1. User lands on the page and sees a PIN entry screen
2. They enter a 4-digit bus PIN
3. App validates the PIN locally against BUS_CONFIG in types/index.ts
4. If PIN is wrong 5 times, lock the form for 10 minutes (client-side only)
5. If PIN is correct, show the tracking screen for that bus
6. Tracking screen shows:
   - Bus name and route (e.g. "Bus A — Shama Route")
   - A large "Start Tracking" button
   - When tracking is active, button changes to "Stop Tracking"
   - A status indicator: "Tracking active", "Offline — buffering", or "Stopped"
   - A small counter showing how many pings have been sent this session
7. When tracking is active:
   - Use navigator.geolocation.watchPosition with high accuracy
   - Every ping must include: bus_id, latitude, longitude, accuracy, created_at
   - If accuracy is worse than 50 meters, skip that ping silently
   - If online, insert ping directly to Supabase locations table using lib/supabase.ts
   - If offline, add ping to the offline buffer using lib/offline-buffer.ts
   - Listen to window online/offline events — when back online, flush the buffer automatically using flushBuffer() from lib/offline-buffer.ts
8. When user stops tracking or closes the tab, stop watchPosition cleanly

---

## PIN VALIDATION RULES

- Validate against BUS_CONFIG locally — do NOT call Supabase for PIN validation
- BUS_CONFIG pins: Bus A = 1001, Bus B = 1002, Bus C = 1003, Bus D = 1004
- On wrong PIN show: "Incorrect PIN. Try again." — do not reveal which bus the PIN belongs to
- Track attempts in useState
- After 5 failed attempts, lock the form for 10 minutes and show a countdown timer
- Lock state can be stored in localStorage so it persists if the page is refreshed

---

## UI RULES

- Add 'use client' at the top — this is a fully client-side page
- Mobile first — big buttons, big text, simple layout
- Use the bus color from BUS_CONFIG as the accent color on the tracking screen
- PIN screen: centered card, numeric input, submit button
- Tracking screen: full page, bus name at top, large status indicator, large start/stop button
- Show a clear visual difference between these 3 states:
  - Tracking active — green accent, pulsing indicator
  - Offline buffering — amber accent, buffered ping count shown
  - Stopped — neutral/gray
- No navbar on this page

---

## IMPORTANT CONSTRAINTS

- Do NOT use Leaflet on this page
- Do NOT use any server actions
- Clean up watchPosition in the useEffect return function
- Use TypeScript strictly — no any types
- Use interfaces from types/index.ts
- Use Tailwind CSS for all styling
- geolocation options: { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }

---

## DONE WHEN

- PIN entry works and validates correctly against BUS_CONFIG
- Lockout triggers after 5 wrong attempts with countdown
- Tracking starts and sends pings to Supabase locations table
- Offline buffer kicks in when connection is lost
- Buffer flushes automatically when connection is restored
- watchPosition is cleaned up properly on stop and unmount
- Page compiles with zero TypeScript errors

When done, confirm: "Phase 1a complete — Tracker page is built and compiling clean."
