import type { Metadata } from "next";
import { InformationPage } from "@/components/information-page";

export const metadata: Metadata = {
  title: "Methodology",
  description: "How Metroplist identifies places, selects evidence and calculates comparisons.",
  alternates: { canonical: "/methodology" },
};

export default function MethodologyPage() {
  return (
    <InformationPage
      eyebrow="Data"
      title="Methodology"
      summary="Place identity, evidence status, reference periods and calculation lineage remain explicit from source to public result."
    >
      <section>
        <h2>Canonical places</h2>
        <p>Names, aliases, public slugs and official identifiers resolve to a stable Metroplist place ID. Geography and boundary versions remain separate from the place identity.</p>
      </section>
      <section>
        <h2>Evidence frames</h2>
        <p>Reported, estimated and projected values are kept distinct. Comparisons select the newest shared frame with a compatible indicator, unit, year, methodology and evidence status rather than comparing independently latest values.</p>
      </section>
      <section>
        <h2>Metroplist calculations</h2>
        <p>Derived results retain their formula version, exact input observations and output lineage. Derivation is separate from evidence status: a calculated result can inherit a reported or estimated frame from compatible inputs.</p>
      </section>
      <section>
        <h2>Revisions</h2>
        <p>Historical observations are append-only. Corrections, revisions and restatements create linked records rather than silently replacing previously published evidence.</p>
      </section>
    </InformationPage>
  );
}
