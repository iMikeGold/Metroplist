import type { Metadata } from "next";
import { InformationPage } from "@/components/information-page";
import { getRuntimeRepositories } from "@/server/database";

export const metadata: Metadata = {
  title: "Coverage",
  description: "Current Metroplist place and indicator coverage.",
  alternates: { canonical: "/coverage" },
};

export const dynamic = "force-dynamic";

export default async function CoveragePage() {
  const repositories = await getRuntimeRepositories();
  const coverage = await repositories.registry.getCoverage();
  const metrics = [
    ["Canonical places", coverage.places],
    ["UN M49 countries or areas", coverage.m49CountriesOrAreas],
    ["Countries with land area", coverage.countriesWithLandArea],
    ["Countries with density", coverage.countriesWithDensity],
    ["Cities with population", coverage.citiesWithPopulation],
    ["Cities with land area", coverage.citiesWithLandArea],
    ["Cities with density", coverage.citiesWithDensity],
    ["Cities with coordinates", coverage.citiesWithCoordinates],
    ["UK authorities with population", coverage.ukAuthoritiesWithPopulation],
    ["UK wards with population", coverage.ukWardsWithPopulation],
  ] as const;
  return (
    <InformationPage
      eyebrow="Data"
      title="Coverage"
      summary="Coverage counts describe published evidence, not merely names in the place registry."
    >
      <section className="coverage-grid">
        {metrics.map(([label, value]) => (
          <div key={label}><strong>{value.toLocaleString()}</strong><span>{label}</span></div>
        ))}
      </section>
      <section>
        <h2>Population archive</h2>
        <p>Country population coverage currently spans {coverage.firstPopulationYear}–{coverage.lastPopulationYear}. City estimates and projections remain separated by evidence status and physical history store.</p>
      </section>
      <section>
        <h2>Known limits</h2>
        <p>A recognised place can exist without every indicator, map boundary or historical series. Metroplist shows missing coverage rather than fabricating compatibility.</p>
      </section>
    </InformationPage>
  );
}
