import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

const BASE_URL = "https://api.beta.ons.gov.uk/v1/datasets";
const RETRIEVED_AT = "2026-07-31";
const rawPath = "data/raw/ons/catalogue.json";
const manifestPath = "data/manifests/ons-catalogue-2026-07-31.json";

const datasets = [];
let offset = 0;
let total = 1;
while (offset < total) {
  const response = await fetch(`${BASE_URL}?limit=500&offset=${offset}`);
  if (!response.ok) {
    throw new Error(`ONS catalogue request failed with ${response.status}.`);
  }
  const page = await response.json();
  datasets.push(...page.items);
  total = page.total_count;
  offset += page.items.length;
  if (page.items.length === 0) break;
}

datasets.sort((left, right) => left.id.localeCompare(right.id));
const raw = `${JSON.stringify({ retrievedAt: RETRIEVED_AT, datasets })}\n`;
const hash = createHash("sha256").update(raw).digest("hex");
const manifest = {
  retrievedAt: RETRIEVED_AT,
  sourceUrl: BASE_URL,
  sha256: hash,
  datasetCount: datasets.length,
  publicationDecision: "catalogued_not_automatically_published",
  datasets: datasets.map((dataset) => ({
    id: dataset.id,
    title: dataset.title,
    type: dataset.type,
    state: dataset.state,
    latestEdition: dataset.links?.latest_edition?.href ?? null,
    latestVersion: dataset.links?.latest_version?.id ?? null,
  })),
};

await mkdir("data/raw/ons", { recursive: true });
await mkdir("data/manifests", { recursive: true });
await writeFile(rawPath, raw);
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
  JSON.stringify(
    { datasetCount: datasets.length, sha256: hash, manifestPath },
    null,
    2,
  ),
);
