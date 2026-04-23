'use client';

import type { Location } from '@/types/index';

export type BusEntry = {
  name: string;
  route: string;
  color: string;
};

interface BusMarkerProps {
  bus: BusEntry;
  location: Location | null;
}

// Returns the inner HTML for a Leaflet divIcon — called by Map.tsx
export function busMarkerHtml(color: string): string {
  return `<div style="width:22px;height:22px;border-radius:50%;background-color:${color};border:2.5px solid rgba(255,255,255,0.9);box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`;
}

// Marker rendering is handled imperatively by Leaflet in Map.tsx
export default function BusMarker(_props: BusMarkerProps) {
  return null;
}
