export interface OnsDatasetReference {
  id: string;
  edition: string;
  version: number;
}

export interface OnsFilterDimension {
  name: string;
  options: string[];
}

export interface OnsFilterRequest {
  dataset: OnsDatasetReference;
  dimensions: OnsFilterDimension[];
}

export interface OnsSourceAsset {
  url: string;
  bytes: Uint8Array;
  sha256: string;
}
