import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  D1DataRequestRepository,
  D1DensityReadRepository,
  D1ObservationRepository,
  D1PlaceRepository,
  D1RegistryReadRepository,
} from "./d1";

export async function getRuntimeRepositories() {
  const { env } = await getCloudflareContext({ async: true });
  return {
    dataRequests: new D1DataRequestRepository(env.DB),
    density: new D1DensityReadRepository(env.DB),
    observations: new D1ObservationRepository(env.DB),
    places: new D1PlaceRepository(env.DB),
    registry: new D1RegistryReadRepository(env.DB),
  };
}
