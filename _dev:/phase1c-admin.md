# Phase 1c — Admin Page

Read CLAUDE.md carefully before starting. Build only what is described in this file.
Phase 1a (tracker page) and Phase 1b (live map) are already complete. Do not touch those files.

---

## GOAL
Build the admin page at `app/admin/page.tsx`. This is where the GPHA IT team manages buses and adds stops to each route.

---

## ACCESS / AUTH

- Protect this page with a simple hardcoded password: "gpha-admin-2024"
- On load, check sessionStorage key: gpha_admin_auth
- If the key exists and equals "true", skip the password screen and show the dashboard
- If not, show a centered password entry screen
- On correct password, set sessionStorage gpha_admin_auth = "true" and show the dashboard
- On wrong password, show: "Incorrect password"
- Add a "Sign out" button on the dashboard that clears sessionStorage and returns to the password screen

---

## DASHBOARD LAYOUT

Two sections on the same page, stacked vertically:
1. Buses section (top)
2. Stops section (bottom)

Show a simple page header: "GPHA Bus Tracker — Admin"

---

## SECTION 1 — BUSES

- On load, fetch all rows from the buses table in Supabase
- Display as a clean table with columns: Bus name, Route, Color swatch, Active
- The color swatch is a small colored square using the bus color value
- Active column shows a toggle switch for each bus
- Toggling updates the active field in Supabase for that bus row
- Show a success toast or inline feedback on update
- Show an error message if the update fails
- Do not allow adding or deleting buses in this MVP

---

## SECTION 2 — STOPS

### Stop list
- On load, fetch all rows from the stops table in Supabase, ordered by bus_id then order_index
- Group stops by bus — show each bus as a heading with its stops listed below
- Each stop row shows: stop name, latitude, longitude, order index, geofence radius (meters)
- Each stop row has an Edit button and a Delete button

### Add stop form
- Show a form above or below the stop list with these fields:
  - Bus: dropdown populated from BUS_CONFIG (Bus A / Bus B / Bus C / Bus D)
  - Stop name: text input
  - Latitude: number input
  - Longitude: number input
  - Order index: number input (hint: the sequence position along the route)
  - Geofence radius: number input, default value 300
- On submit:
  - Validate all fields are filled
  - Insert into stops table in Supabase
  - Clear the form on success
  - Refresh the stop list
  - Show success feedback

### Edit stop (inline)
- Clicking Edit on a stop row makes the name and geofence radius fields editable inline
- Show Save and Cancel buttons inline
- On Save, update that row in Supabase
- On Cancel, revert to display mode
- Only name and geofence_radius are editable — lat, lng, order_index are read only after creation

### Delete stop
- Clicking Delete shows a browser confirm() dialog: "Delete stop [name]? This cannot be undone."
- On confirm, delete the row from Supabase and remove it from the list
- On error, show an error message

---

## UI RULES

- Clean, simple table and form layout
- This page will mostly be used on desktop but should still work on mobile
- Use Tailwind CSS for all styling
- Show loading states while fetching from Supabase
- Show clear success and error feedback on every operation
- No map needed on this page
- Keep the UI functional over decorative — this is a utility page

---

## IMPORTANT CONSTRAINTS

- Add 'use client' at the top
- Use TypeScript strictly — no any types
- Use interfaces from types/index.ts for all data shapes
- Use the Supabase browser client from lib/supabase.ts for all operations
- Do not hardcode any stop or bus data — everything comes from or goes to Supabase
- bus_id values must come from Supabase buses table, not hardcoded UUIDs

---

## DONE WHEN

- Password protection works and persists on refresh via sessionStorage
- Buses table loads from Supabase and active toggle updates correctly
- Stops load from Supabase grouped by bus
- Add stop form inserts correctly and refreshes the list
- Inline edit saves name and geofence radius correctly
- Delete works with confirmation and removes from list
- All operations show loading, success, and error states
- Page compiles with zero TypeScript errors

When done, confirm: "Phase 1c complete — Admin page is built and compiling clean."
