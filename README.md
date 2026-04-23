# GPHA Bus Tracker

A real-time bus tracking web app for Ghana Ports and Harbours Authority (GPHA) staff. Staff can open the app on their phones, see where all four company buses currently are on a live map, and get notified when their bus is approaching their stop. Drivers use a PIN-protected tracker page to broadcast their GPS location. The app works as a PWA — it can be installed on Android and iOS without going through an app store.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Map | Leaflet.js |
| Database | Supabase (Postgres) |
| Realtime | Supabase Realtime |
| Backend functions | Supabase Edge Functions |
| Notifications | Web Push API + Service Workers |
| GPS | Browser Geolocation API |
| Hosting | Vercel |
| Language | TypeScript |

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd "GPHA BUS TRACKER V2"
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add environment variables

Create a `.env.local` file in the project root with the following keys (see table below):

```bash
cp .env.local.example .env.local  # if an example file exists, otherwise create manually
```

Fill in the values from your Supabase project dashboard.

### 4. Run the Supabase schema

Open the Supabase SQL editor for your project and run the contents of `supabase/schema.sql`. This creates all four tables (`buses`, `locations`, `stops`, `push_subscriptions`).

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — server only, never expose to client | Yes |
| `NEXT_PUBLIC_MAP_CENTER_LAT` | Map default latitude (Takoradi: `4.8977`) | Yes |
| `NEXT_PUBLIC_MAP_CENTER_LNG` | Map default longitude (Takoradi: `-1.7553`) | Yes |
| `VAPID_PUBLIC_KEY` | VAPID public key for Web Push (Phase 2) | Phase 2 |
| `VAPID_PRIVATE_KEY` | VAPID private key for Web Push (Phase 2) | Phase 2 |

---

## Available Scripts

```bash
npm run dev          # Start local dev server
npm run build        # Production build
npm run type-check   # TypeScript type checking (no emit)
```

---

## Adding a Teammate as a GitHub Contributor

1. Go to the repository on GitHub.
2. Click **Settings** → **Collaborators and teams**.
3. Click **Add people** and enter their GitHub username or email.
4. Set their role to **Write** (or **Admin** if they need full access).
5. They will receive an invitation email — they must accept it before they can push.

---

## Running the Supabase Schema

The file `supabase/schema.sql` contains all `CREATE TABLE` statements for the project.

To run it:

1. Log in to [supabase.com](https://supabase.com) and open your project.
2. Go to **SQL Editor** in the left sidebar.
3. Click **New query**.
4. Paste the contents of `supabase/schema.sql`.
5. Click **Run**.

The four tables (`buses`, `locations`, `stops`, `push_subscriptions`) will be created. After running, use the **Table Editor** to add the four buses with their hashed PINs and colors.

---

## Project Structure

```
app/                  # Next.js App Router pages
  page.tsx            # Live Map (staff view)
  track/page.tsx      # Tracker (driver/passenger GPS)
  admin/page.tsx      # Admin — manage buses and stops
  api/push/route.ts   # Web Push endpoint (Phase 2)
components/           # Shared UI components
lib/                  # Utility modules (Supabase, offline buffer, geofence)
types/                # Shared TypeScript interfaces
supabase/             # schema.sql — run once in Supabase SQL editor
public/sw.js          # Service worker
```
