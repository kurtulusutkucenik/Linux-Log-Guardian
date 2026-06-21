export type AttackMarker = {
  ip: string;
  lat: number;
  lon: number;
  countryCode: string;
  country: string;
  kind: "ban" | "incident";
  reason?: string;
  risk?: number;
  source?: string;
};

export type AttackGeoResponse = {
  count: number;
  total_ips: number;
  geo_lookup: boolean;
  data_source?: "live" | "report";
  markers: AttackMarker[];
};
