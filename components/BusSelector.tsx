'use client';

import { useState, useEffect, useRef } from 'react';
import { BUS_CONFIG } from '@/types/index';

export const SELECTED_BUS_KEY = 'gpha_selected_bus';

type BusConfigItem = (typeof BUS_CONFIG)[number];

interface BusSelectorProps {
  selectedBus: BusConfigItem;
  onSelect: (bus: BusConfigItem) => void;
}

export default function BusSelector({ selectedBus, onSelect }: BusSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = (bus: BusConfigItem) => {
    localStorage.setItem(SELECTED_BUS_KEY, bus.name);
    onSelect(bus);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
      >
        <span
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: selectedBus.color }}
        />
        <span>
          {selectedBus.name} — {selectedBus.route}
        </span>
        <span className="text-xs opacity-60">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-[1001]">
          {BUS_CONFIG.map((bus) => (
            <button
              key={bus.name}
              onClick={() => handleSelect(bus)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:bg-gray-800 ${
                bus.name === selectedBus.name ? 'bg-gray-800' : ''
              }`}
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: bus.color }}
              />
              <span className="text-white">
                {bus.name} — {bus.route}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
