export interface SourceProtectionNotice {
  datasetReleaseId: string;
  title: string;
  summary: string;
  methods: string[];
  sourceUrl: string;
}

export const sourceProtectionNotices: SourceProtectionNotice[] = [
  {
    datasetReleaseId: "rel_ons_ts001_2021_v3",
    title: "ONS Census 2021 statistical disclosure control",
    summary:
      "ONS protects Census 2021 confidentiality through targeted record swapping, cell-key perturbation and disclosure rules. Small counts can therefore differ slightly from an unprotected count.",
    methods: [
      "Targeted record swapping",
      "Cell-key perturbation",
      "Disclosure rules for sparse tables",
    ],
    sourceUrl:
      "https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/methodologies/protectingpersonaldataincensus2021results",
  },
];

export function sourceProtectionNotice(
  datasetReleaseId: string | null,
): SourceProtectionNotice | null {
  return (
    sourceProtectionNotices.find(
      (notice) => notice.datasetReleaseId === datasetReleaseId,
    ) ?? null
  );
}
