# Phase 1b — Live Map Page

Read CLAUDE.md carefully before starting. Build only what is described in this file.
Phase 1a (tracker page) is already complete. Do not touch app/track/page.tsx.

---

## GOAL
Build the live map page at `app/page.tsx`. This is the page all GPHA staff open to see where the 4 buses are in real time.

---

## FLOW

1. Page loads and shows a Leaflet map centered on Takoradi
   - Center: lat 4.8977, lng -1.7553 (from environment variables)
   - Default zoom: 12
2. On load, fetch the latest location for each bus from Supabase:
   - For each bus_id in BUS_CONFIG, query the locations table for the single most recent row
   - Do this in parallel (Promise.all) not sequentially
3. Render a colored circular marker for each bus using its color from BUS_CONFIG
   - Marker shows bus name and route as a tooltip on hover
   - If a bus has no location data yet, show its marker at map center, grayed out, tooltip: "No signal yet"
4. Subscribe to Supabase Realtime on the locations table
   - Filter inserts by each bus_id
   - When a new location insert arrives, update only that bus marker position instantly
   - Do NOT accumulate location history — only keep the latest position per bus in state
5. Unsubscribe from Realtime in the useEffect cleanup

---

## BUS SELECTOR BAR

- Show a bar at the top of the screen: "Your bus: [Bus A — Shama ▼]"
- Tapping opens a simple dropdown listing all 4 buses
- On selection, save to localStorage key: gpha_selected_bus
- On page load, read from localStorage and pre-select their bus
- This selection is for Phase 2 notifications — wire it up now but do not build notifications yet
- If nothing is saved in localStorage, default to Bus A

---

## LEGEND

- Show a fixed legend bar at the bottom of the screen
- Lists all 4 buses with their colored dot and route name
- Example: 🔴 Bus A — Shama  🟢 Bus B — Anaji  🟡 Bus C — Sekondi  🔵 Bus D — Biaho
- Use actual colored divs not emojis for the dots

---

## MAP COMPONENT

- Build the Leaflet map inside components/Map.tsx
- Import Leaflet using dynamic() with ssr: false — never import Leaflet at the top level of any file
- Accept these props: buses (BUS_CONFIG), locations (Record<string, Location | null>)
- Build the bus marker inside components/BusMarker.tsx
- BusMarker accepts: bus (Bus), location (Location | null)
- Use Leaflet's divIcon to render a colored circular marker with the bus color

---

## UI RULES

- Map takes full screen height minus the top selector bar and bottom legend
- Mobile first
- Top bar and bottom legend are fixed — map fills the space between them
- Keep it clean — staff need to read this at a glance
- Use Tailwind CSS for all layout and styling outside the map

---

## IMPORTANT CONSTRAINTS

- Add 'use client' at the top of app/page.tsx and components/Map.tsx
- Use TypeScript strictly — no any types
- Use interfaces from types/index.ts for all data shapes
- Use the Supabase browser client from lib/supabase.ts
- Never import Leaflet outside of a dynamic() import
- Environment variables for map center: NEXT_PUBLIC_MAP_CENTER_LAT and NEXT_PUBLIC_MAP_CENTER_LNG

---

## DONE WHEN

- Map loads centered on Takoradi with all 4 bus markers visible
- Latest bus positions load from Supabase on page load
- Realtime updates move the correct bus marker when a new ping comes in
- Bus selector saves and restores from localStorage
- Legend shows all 4 buses with correct colors
- Page compiles with zero TypeScript errors
- No SSR errors related to Leaflet

When done, confirm: "Phase 1b complete — Live map page is built and compiling clean."
