export interface LocationCandidate {
  latitude: number | null;
  longitude: number | null;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  resolutionMethod: "cloudflare_ip_geolocation" | "browser_geolocation";
  accuracyClass: "coarse_network_hint" | "device_reported";
  confirmationRequired: true;
}

export interface BrowserLocationConsentRequest {
  consentGranted: boolean;
  requestedAt: string;
}

export interface BrowserLocationReading {
  latitude: number;
  longitude: number;
  accuracyMetres: number;
  capturedAt: string;
}
