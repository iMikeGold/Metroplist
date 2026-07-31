import { FOUNDATION_RELEASE } from "@/config/release";
import { getRuntimeRepositories } from "@/server/database";

export async function GET() {
  try {
    const repositories = await getRuntimeRepositories();
    const coverage = await repositories.registry.getCoverage();
    return Response.json({
      service: "metroplist-app-site",
      release: FOUNDATION_RELEASE.version,
      status: FOUNDATION_RELEASE.status,
      runtimeDatabaseStatus: "bound",
      coverage,
    });
  } catch {
    return Response.json(
      {
        service: "metroplist-app-site",
        release: FOUNDATION_RELEASE.version,
        status: "degraded",
        runtimeDatabaseStatus: "unavailable",
      },
      { status: 503 },
    );
  }
}
