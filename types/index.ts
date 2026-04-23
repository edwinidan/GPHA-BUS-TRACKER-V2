export interface Bus {
  id: string;
  name: string;
  route: string;
  pin: string;
  color: string;
  active: boolean;
  created_at: string;
}

export interface Location {
  id: string;
  bus_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  created_at: string;
}

export interface Stop {
  id: string;
  bus_id: string;
  name: string;
  latitude: number;
  longitude: number;
  order_index: number;
  geofence_radius_meters: number;
}

export interface PushSubscription {
  id: string;
  bus_id: string;
  stop_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export const BUS_CONFIG = [
  { name: "Bus A", route: "Shama", color: "#E63946", pin: "1001" },
  { name: "Bus B", route: "Anaji", color: "#2A9D8F", pin: "1002" },
  { name: "Bus C", route: "Sekondi", color: "#E9C46A", pin: "1003" },
  { name: "Bus D", route: "Biaho", color: "#457B9D", pin: "1004" },
] as const;
