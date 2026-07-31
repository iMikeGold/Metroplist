import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <p className="eyebrow">Places, populations and comparisons</p>
        <h1>Metroplist</h1>
        <p className="lede">
          Explore how places around the world are changing, and compare the
          measurements that shape life there.
        </p>
        <div className="primary-actions">
          <Link className="primary-link" href="/map">Explore places</Link>
          <form action="/map" method="get">
            <label htmlFor="home-place-search">Search for a place</label>
            <div>
              <input id="home-place-search" name="q" placeholder="London, Japan, E09000011" required />
              <button type="submit">Search</button>
            </div>
          </form>
          <Link className="secondary-link" href="/compare">Compare places</Link>
        </div>
      </section>

      <section className="platform-summary">
        <div><strong>235</strong><span>countries with population histories</span></div>
        <div><strong>13,191</strong><span>cities with current estimates</span></div>
        <div><strong>7,967</strong><span>UK authorities and wards with population</span></div>
      </section>

      <section className="notice" aria-labelledby="verified-examples">
        <p className="eyebrow">Sample records</p>
        <h2 id="verified-examples">See Metroplist in detail</h2>
        <p>
          <Link href="/density/greenwich">Greenwich</Link> ·{" "}
          <Link href="/density/bromley">Bromley</Link>
        </p>
      </section>
    </main>
  );
}
