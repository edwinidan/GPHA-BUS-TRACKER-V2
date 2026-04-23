'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import type { Location } from '@/types/index';
import { BUS_CONFIG } from '@/types/index';
import { busMarkerHtml } from './BusMarker';

type BusConfigItem = (typeof BUS_CONFIG)[number];

interface MapProps {
  buses: ReadonlyArray<BusConfigItem>;
  locations: Record<string, Location | null>;
}

const CENTER_LAT = parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LAT ?? '4.8977');
const CENTER_LNG = parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LNG ?? '-1.7553');

export default function MapComponent({ buses, locations }: MapProps) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const markersRef = useRef<Record<string, import('leaflet').Marker>>({});
  const leafletRef = useRef<typeof import('leaflet') | null>(null);

  // Keep a ref to the latest locations so the async init can read them on completion
  const locationsRef = useRef(locations);
  useEffect(() => {
    locationsRef.current = locations;
  });

  // Initialize Leaflet map once on mount; clean up on unmount
  useEffect(() => {
    if (!mapDivRef.current) return;
    let mounted = true;

    void import('leaflet').then((Lmod) => {
      if (!mounted || !mapDivRef.current || mapRef.current) return;

      const L = Lmod.default;
      leafletRef.current = L;

      const map = L.map(mapDivRef.current, {
        center: [CENTER_LAT, CENTER_LNG],
        zoom: 12,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Create a marker for each bus using the most recent locations at init time
      buses.forEach((bus) => {
        const loc = locationsRef.current[bus.name];
        const color = loc ? bus.color : '#9CA3AF';
        const pos: [number, number] = loc
          ? [loc.latitude, loc.longitude]
          : [CENTER_LAT, CENTER_LNG];

        const icon = L.divIcon({
          html: busMarkerHtml(color),
          className: '',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const tooltip = loc ? `${bus.name} — ${bus.route}` : 'No signal yet';
        const marker = L.marker(pos, { icon }).addTo(map).bindTooltip(tooltip, {
          permanent: false,
          direction: 'top',
          offset: [0, -14],
        });

        markersRef.current[bus.name] = marker;
      });

      mapRef.current = map;
    });

    return () => {
      mounted = false;
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
      markersRef.current = {};
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update marker positions and colors whenever locations change
  useEffect(() => {
    const L = leafletRef.current;
    if (!L || !mapRef.current) return;

    buses.forEach((bus) => {
      const marker = markersRef.current[bus.name];
      const loc = locations[bus.name];
      if (!marker) return;

      if (loc) {
        marker.setLatLng([loc.latitude, loc.longitude]);
        marker.setIcon(
          L.divIcon({
            html: busMarkerHtml(bus.color),
            className: '',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          }),
        );
        marker.setTooltipContent(`${bus.name} — ${bus.route}`);
      }
    });
  }, [buses, locations]);

  return <div ref={mapDivRef} className="h-full w-full" />;
}
