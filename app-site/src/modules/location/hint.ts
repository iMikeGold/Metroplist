export interface UnavailableLocationHint {
  available: false;
  confirmationRequired: true;
  accuracyClass: "unavailable";
  reason: string;
}

export interface AvailableLocationHint {
  available: true;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  cloudflareColo: string | null;
  resolutionMethod: "cloudflare_ip_geolocation";
  accuracyClass: "coarse_network_hint";
  confirmationRequired: true;
}

export type LocationHint = AvailableLocationHint | UnavailableLocationHint;

const unavailable = (reason: string): UnavailableLocationHint => ({
  available: false,
  confirmationRequired: true,
  accuracyClass: "unavailable",
  reason,
});

export async function requestLocationHint(
  request: typeof fetch = fetch,
): Promise<LocationHint> {
  try {
    const response = await request("/api/location-hint");
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return unavailable("Location hint returned an unsupported response.");
    }
    const payload = (await response.json()) as Partial<LocationHint>;
    if (payload.available !== true) {
      return unavailable(
        "reason" in payload && typeof payload.reason === "string"
          ? payload.reason
          : "Location hint is unavailable in this runtime.",
      );
    }
    return {
      available: true,
      countryCode: payload.countryCode ?? null,
      region: payload.region ?? null,
      city: payload.city ?? null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      timezone: payload.timezone ?? null,
      cloudflareColo: payload.cloudflareColo ?? null,
      resolutionMethod: "cloudflare_ip_geolocation",
      accuracyClass: "coarse_network_hint",
      confirmationRequired: true,
    };
  } catch {
    return unavailable("Location hint request failed.");
  }
}
