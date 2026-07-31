import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

interface CoarseLocation {
  [key: string]: unknown;
  country?: string;
  region?: string;
  city?: string;
  latitude?: string;
  longitude?: string;
  timezone?: string;
  colo?: string;
}

export async function GET() {
  let cf: CoarseLocation | undefined;
  try {
    ({ cf } = await getCloudflareContext<CoarseLocation>({ async: true }));
  } catch {
    return NextResponse.json({
      available: false,
      confirmationRequired: true,
      accuracyClass: "unavailable",
      reason: "Location hint is unavailable in this runtime.",
    });
  }
  return NextResponse.json({
    available: Boolean(cf),
    countryCode: cf?.country ?? null,
    region: cf?.region ?? null,
    city: cf?.city ?? null,
    latitude: cf?.latitude ? Number(cf.latitude) : null,
    longitude: cf?.longitude ? Number(cf.longitude) : null,
    timezone: cf?.timezone ?? null,
    cloudflareColo: cf?.colo ?? null,
    resolutionMethod: "cloudflare_ip_geolocation",
    accuracyClass: "coarse_network_hint",
    confirmationRequired: true,
  });
}
