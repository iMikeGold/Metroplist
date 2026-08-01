import type { Metadata } from "next";
import { InformationPage } from "@/components/information-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Report a data issue",
  description: "Report a specific Metroplist place, observation, comparison or Snapshot.",
  alternates: { canonical: "/report-data-issue" },
};

export default async function ReportDataIssuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await searchParams;
  const contextRows = Object.entries(context)
    .filter(([, value]) => typeof value === "string" && value)
    .map(([key, value]) => [key, String(value)] as const);
  return (
    <InformationPage
      eyebrow="Corrections"
      title="Report a data issue"
      summary="Keep the exact page and evidence context with a correction request."
    >
      {contextRows.length ? (
        <section>
          <h2>Record context</h2>
          <dl className="context-list">
            {contextRows.map(([key, value]) => (
              <div key={key}><dt>{key.replaceAll("_", " ")}</dt><dd>{value}</dd></div>
            ))}
          </dl>
        </section>
      ) : null}
      <section>
        <h2>Reporting channel</h2>
        {siteConfig.reportEmail ? (
          <p><a href={`mailto:${siteConfig.reportEmail}`}>Email the Metroplist data team</a></p>
        ) : (
          <p>The approved reporting inbox and retention process have not yet been configured. No personal-data form is enabled until that launch requirement is complete.</p>
        )}
      </section>
      <section>
        <h2>What happens next</h2>
        <p>Metroplist checks the referenced place, observation, calculation and source release. An accepted correction creates linked evidence or a correction notice; the historical result is not silently rewritten.</p>
      </section>
    </InformationPage>
  );
}
