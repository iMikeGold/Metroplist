import type {
  OnsFilterRequest,
  OnsSourceAsset,
} from "./types";

const DEFAULT_BASE_URL = "https://api.beta.ons.gov.uk/v1";

export class OnsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export class OnsApiClient {
  constructor(
    private readonly request: typeof fetch = fetch,
    private readonly baseUrl = DEFAULT_BASE_URL,
  ) {}

  private async json<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await this.request(`${this.baseUrl}${path}`, init);
    if (!response.ok) {
      throw new OnsApiError(
        `ONS API request failed with ${response.status}.`,
        response.status,
      );
    }
    return response.json() as Promise<T>;
  }

  listDatasets(limit = 100, offset = 0) {
    const boundedLimit = Math.max(1, Math.min(500, Math.trunc(limit)));
    const boundedOffset = Math.max(0, Math.trunc(offset));
    return this.json<Record<string, unknown>>(
      `/datasets?limit=${boundedLimit}&offset=${boundedOffset}`,
    );
  }

  listEditions(datasetId: string, limit = 100) {
    return this.json<Record<string, unknown>>(
      `/datasets/${encodeURIComponent(datasetId)}/editions?limit=${Math.max(1, Math.min(500, Math.trunc(limit)))}`,
    );
  }

  listVersions(datasetId: string, edition: string, limit = 100) {
    return this.json<Record<string, unknown>>(
      `/datasets/${encodeURIComponent(datasetId)}/editions/${encodeURIComponent(edition)}/versions?limit=${Math.max(1, Math.min(500, Math.trunc(limit)))}`,
    );
  }

  listDimensions(
    datasetId: string,
    edition: string,
    version: number,
    limit = 100,
  ) {
    return this.json<Record<string, unknown>>(
      `/datasets/${encodeURIComponent(datasetId)}/editions/${encodeURIComponent(edition)}/versions/${Math.trunc(version)}/dimensions?limit=${Math.max(1, Math.min(500, Math.trunc(limit)))}`,
    );
  }

  listDimensionOptions(
    datasetId: string,
    edition: string,
    version: number,
    dimension: string,
    limit = 100,
    offset = 0,
  ) {
    return this.json<Record<string, unknown>>(
      `/datasets/${encodeURIComponent(datasetId)}/editions/${encodeURIComponent(edition)}/versions/${Math.trunc(version)}/dimensions/${encodeURIComponent(dimension)}/options?limit=${Math.max(1, Math.min(500, Math.trunc(limit)))}&offset=${Math.max(0, Math.trunc(offset))}`,
    );
  }

  getObservation(
    datasetId: string,
    edition: string,
    version: number,
    query: URLSearchParams,
  ) {
    return this.json<Record<string, unknown>>(
      `/datasets/${encodeURIComponent(datasetId)}/editions/${encodeURIComponent(edition)}/versions/${Math.trunc(version)}/observations?${query.toString()}`,
    );
  }

  createFilter(filter: OnsFilterRequest, submit = false) {
    return this.json<Record<string, unknown>>(
      `/filters${submit ? "?submitted=true" : ""}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(filter),
      },
    );
  }

  getFilterOutput(filterOutputId: string) {
    return this.json<Record<string, unknown>>(
      `/filter-outputs/${encodeURIComponent(filterOutputId)}`,
    );
  }

  async downloadCsv(url: string): Promise<OnsSourceAsset> {
    const parsed = new URL(url);
    if (
      parsed.protocol !== "https:" ||
      !parsed.hostname.endsWith(".ons.gov.uk")
    ) {
      throw new Error("ONS downloads must use an official HTTPS ONS host.");
    }
    const response = await this.request(parsed);
    if (!response.ok) {
      throw new OnsApiError(
        `ONS download failed with ${response.status}.`,
        response.status,
      );
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const sha256 = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
    return { url: parsed.toString(), bytes, sha256 };
  }
}
