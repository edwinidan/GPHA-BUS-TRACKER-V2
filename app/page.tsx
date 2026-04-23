'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { BUS_CONFIG } from '@/types/index';
import type { Location } from '@/types/index';
import { supabase } from '@/lib/supabase';
import BusSelector, { SELECTED_BUS_KEY } from '@/components/BusSelector';

// Leaflet must never render on the server
const MapComponent = dynamic(() => import('@/components/Map'), { ssr: false });

type BusConfigItem = (typeof BUS_CONFIG)[number];

type LocationMap = Record<string, Location | null>;

const defaultLocations: LocationMap = Object.fromEntries(
  BUS_CONFIG.map((b) => [b.name, null]),
);

export default function HomePage() {
  const [selectedBus, setSelectedBus] = useState<BusConfigItem>(BUS_CONFIG[0]);
  const [locations, setLocations] = useState<LocationMap>(defaultLocations);

  // Restore selected bus from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(SELECTED_BUS_KEY);
    if (saved) {
      const found = BUS_CONFIG.find((b) => b.name === saved);
      if (found) setSelectedBus(found);
    }
  }, []);

  // Fetch initial locations and set up Realtime subscriptions
  useEffect(() => {
    const channels: ReturnType<typeof supabase.channel>[] = [];

    async function init() {
      // Get bus UUIDs from Supabase — needed for location queries and Realtime filters
      const { data: busRows } = await supabase
        .from('buses')
        .select('id, name');

      if (!busRows) return;

      const busIdMap: Record<string, string> = {};
      (busRows as Array<{ id: string; name: string }>).forEach((row) => {
        busIdMap[row.name] = row.id;
      });

      // Fetch the most recent location for every bus in parallel
      const entries = await Promise.all(
        BUS_CONFIG.map(async (bus) => {
          const busId = busIdMap[bus.name];
          if (!busId) return [bus.name, null] as const;

          const { data } = await supabase
            .from('locations')
            .select('*')
            .eq('bus_id', busId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return [bus.name, (data as Location | null)] as const;
        }),
      );

      setLocations(Object.fromEntries(entries));

      // Subscribe to live inserts, one channel per bus
      BUS_CONFIG.forEach((bus) => {
        const busId = busIdMap[bus.name];
        if (!busId) return;

        const channel = supabase
          .channel(`bus-loc-${busId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'locations',
              filter: `bus_id=eq.${busId}`,
            },
            (payload) => {
              setLocations((prev) => ({
                ...prev,
                [bus.name]: payload.new as unknown as Location,
              }));
            },
          )
          .subscribe();

        channels.push(channel);
      });
    }

    void init();

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, []);

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-gray-900">
      {/* Top bar — bus selector */}
      <header className="flex-shrink-0 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        <span className="text-gray-400 text-sm font-medium whitespace-nowrap">Your bus:</span>
        <BusSelector selectedBus={selectedBus} onSelect={setSelectedBus} />
      </header>

      {/* Map — fills all remaining space */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <MapComponent buses={BUS_CONFIG} locations={locations} />
      </div>

      {/* Bottom legend */}
      <footer className="flex-shrink-0 bg-gray-900 border-t border-gray-800 px-4 py-3">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {BUS_CONFIG.map((bus) => (
            <div key={bus.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: bus.color }}
              />
              <span className="text-gray-300 text-sm">
                {bus.name} — {bus.route}
              </span>
            </div>
          ))}
        </div>
      </footer>
    </main>
  );
}
