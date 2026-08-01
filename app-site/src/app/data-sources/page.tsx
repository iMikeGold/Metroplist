import type { Metadata } from "next";
import { InformationPage } from "@/components/information-page";
import { sourceProtectionNotices } from "@/modules/provenance/source-notices";

export const metadata: Metadata = {
  title: "Data sources",
  description: "Publishers, releases and source-specific qualifications used by Metroplist.",
  alternates: { canonical: "/data-sources" },
};

export default function DataSourcesPage() {
  return (
    <InformationPage
      eyebrow="Data"
      title="Data sources"
      summary="Metroplist preserves each publisher, dataset release, acquisition date and source qualification with the observations it publishes."
    >
      <section>
        <h2>Current source families</h2>
        <ul>
          <li>United Nations M49 geographical classifications</li>
          <li>United Nations World Population Prospects 2024</li>
          <li>United Nations World Urbanization Prospects 2025</li>
          <li>World Bank country and capital-city data</li>
          <li>Office for National Statistics Census 2021 and geography products</li>
        </ul>
        <p>Coverage varies by geography, indicator and reference period. A source name does not imply that every Metroplist result was directly published by that source.</p>
      </section>
      <section>
        <h2>Source-specific protection notes</h2>
        {sourceProtectionNotices.map((notice) => (
          <article key={notice.datasetReleaseId} className="source-notice">
            <h3>{notice.title}</h3>
            <p>{notice.summary}</p>
            <ul>{notice.methods.map((method) => <li key={method}>{method}</li>)}</ul>
            <a href={notice.sourceUrl}>Read the publisher’s methodology</a>
          </article>
        ))}
      </section>
    </InformationPage>
  );
}
