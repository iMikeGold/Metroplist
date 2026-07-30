export interface Publisher {
  id: string;
  canonicalName: string;
  jurisdiction: string | null;
  authorityGrade: "official" | "academic" | "institutional" | "commercial" | "unknown";
}

export interface Dataset {
  id: string;
  publisherId: string;
  canonicalTitle: string;
  licence: string | null;
  sourceUrl: string | null;
}

export interface DatasetRelease {
  id: string;
  datasetId: string;
  edition: string | null;
  version: string | null;
  releaseDate: string | null;
  retrievedAt: string | null;
  contentHash: string | null;
  archivedObjectKey: string | null;
}
