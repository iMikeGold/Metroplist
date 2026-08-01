import type {
  SnapshotManifest,
  SnapshotStatus,
  SnapshotType,
} from "@/modules/publications";

export type PublicationReferenceType =
  | "place"
  | "observation"
  | "calculation"
  | "indicator"
  | "source_release";

export interface PublicationReference {
  referenceType: PublicationReferenceType;
  referenceId: string;
  referenceRole: string;
  ordinal: number;
}

export interface PublicationSnapshot {
  id: string;
  publicSlug: string;
  schemaVersion: number;
  snapshotType: SnapshotType;
  title: string;
  summary: string;
  manifest: SnapshotManifest;
  contentHash: string;
  canonicalUrl: string;
  createdAt: string;
  status: SnapshotStatus;
  relatedSnapshotId: string | null;
  statusReason: string | null;
  references: PublicationReference[];
}

export interface CreatePublicationSnapshot {
  id: string;
  publicSlug: string;
  manifest: SnapshotManifest;
  contentHash: string;
  canonicalUrl: string;
  references: PublicationReference[];
}

export interface PublicationRepository {
  create(
    snapshot: CreatePublicationSnapshot,
  ): Promise<{ snapshot: PublicationSnapshot; deduplicated: boolean }>;
  findBySlug(publicSlug: string): Promise<PublicationSnapshot | null>;
  findByContentHash(contentHash: string): Promise<PublicationSnapshot | null>;
  listPublishedSlugs(
    limit: number,
  ): Promise<Array<{ publicSlug: string; createdAt: string }>>;
  withdraw(snapshotId: string, reason: string, createdAt: string): Promise<void>;
  supersede(
    snapshotId: string,
    relatedSnapshotId: string,
    reason: string,
    createdAt: string,
  ): Promise<void>;
}
