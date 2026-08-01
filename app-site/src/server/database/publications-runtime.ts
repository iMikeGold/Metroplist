import { getCloudflareContext } from "@opennextjs/cloudflare";
import { D1PublicationRepository } from "./d1";
import type { D1DatabaseLike } from "./types";

export async function getPublicationRepository(): Promise<D1PublicationRepository | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const publicationsDb = (
      env as unknown as { PUBLICATIONS_DB?: D1DatabaseLike }
    ).PUBLICATIONS_DB;
    return publicationsDb ? new D1PublicationRepository(publicationsDb) : null;
  } catch {
    return null;
  }
}
