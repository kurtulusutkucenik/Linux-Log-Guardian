export type AttackMarker = {
  ip: string;
  lat: number;
  lon: number;
  countryCode: string;
  country: string;
  kind: "ban" | "incident" | "ack";
  reason?: string;
  risk?: number;
  source?: string;
  operator?: string;
};

export type AttackGeoResponse = {
  count: number;
  total_ips: number;
  geo_lookup: boolean;
  data_source?: "live" | "report";
  bans_source?: string;
  defender?: { lat: number; lng: number };
  markers: AttackMarker[];
};
