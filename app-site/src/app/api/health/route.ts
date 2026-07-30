import { FOUNDATION_RELEASE } from "@/config/release";

export function GET() {
  return Response.json({
    service: "metroplist-app-site",
    release: FOUNDATION_RELEASE.version,
    status: FOUNDATION_RELEASE.status,
    runtimeDatabaseStatus: "not_bound",
    seededVerifiedObservationCount: 10,
  });
}
