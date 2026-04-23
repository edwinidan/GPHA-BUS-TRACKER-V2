import type { SupabaseClient } from "@supabase/supabase-js";

const BUFFER_KEY = "gpha_ping_buffer";
const MAX_BUFFER_SIZE = 500;

export interface Ping {
  bus_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  created_at: string;
}

export function addPing(ping: Ping): void {
  const buffer = getBuffer();
  buffer.push(ping);
  // Drop oldest pings if buffer exceeds max size
  if (buffer.length > MAX_BUFFER_SIZE) {
    buffer.splice(0, buffer.length - MAX_BUFFER_SIZE);
  }
  localStorage.setItem(BUFFER_KEY, JSON.stringify(buffer));
}

export function getBuffer(): Ping[] {
  try {
    const raw = localStorage.getItem(BUFFER_KEY);
    return raw ? (JSON.parse(raw) as Ping[]) : [];
  } catch {
    return [];
  }
}

export function clearBuffer(): void {
  localStorage.removeItem(BUFFER_KEY);
}

export async function flushBuffer(supabaseClient: SupabaseClient): Promise<void> {
  const buffer = getBuffer();
  if (buffer.length === 0) return;

  const { error } = await supabaseClient.from("locations").insert(buffer);

  if (!error) {
    clearBuffer();
  }
}
