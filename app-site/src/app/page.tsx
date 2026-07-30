import { FOUNDATION_RELEASE } from "@/config/release";
import Link from "next/link";

const foundationLayers = [
  "Place identity and aliases",
  "Versioned geographies and boundaries",
  "Indicators, units and observations",
  "Append-only revisions and lineage",
  "Directional and neutral comparisons",
  "Timeline comparison rules",
  "Provenance and knowledge claims",
  "Demand-led data requests",
];

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <p className="eyebrow">Metroplist application foundation</p>
        <h1>{FOUNDATION_RELEASE.name}</h1>
        <p className="lede">
          Density is the first public expression of a larger time-aware
          geographical evidence system.
        </p>
        <div className="status" role="status">
          <span>Foundation state</span>
          <strong>{FOUNDATION_RELEASE.status}</strong>
        </div>
      </section>

      <section className="panel" aria-labelledby="foundation-layers">
        <div>
          <p className="eyebrow">Release boundary</p>
          <h2 id="foundation-layers">Architecture wide. Implementation narrow.</h2>
        </div>
        <ol>
          {foundationLayers.map((layer) => (
            <li key={layer}>{layer}</li>
          ))}
        </ol>
      </section>

      <section className="notice">
        <strong>The first verified evidence slice is ready.</strong>
        <p>
          Explore <Link href="/density/greenwich">Greenwich</Link>, <Link href="/density/bromley">Bromley</Link>, or their <Link href="/compare/greenwich/bromley">density comparison</Link>.
        </p>
      </section>
    </main>
  );
}
