import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <p className="eyebrow">Geographical evidence platform</p>
        <h1>Metroplist</h1>
        <p className="lede">
          Explore places, populations and geographical evidence across the
          world.
        </p>
        <div className="primary-actions">
          <Link className="primary-link" href="/map">Explore the Atlas</Link>
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
        <div><strong>8,592</strong><span>canonical places</span></div>
        <div><strong>248</strong><span>UN M49 countries or areas</span></div>
        <div><strong>1950–2023</strong><span>population archive</span></div>
      </section>

      <section className="notice" aria-labelledby="verified-examples">
        <p className="eyebrow">Density · verified indicator</p>
        <h2 id="verified-examples">Verified examples</h2>
        <p>
          <Link href="/density/greenwich">Greenwich</Link> ·{" "}
          <Link href="/density/bromley">Bromley</Link> ·{" "}
          <Link href="/compare/greenwich/bromley">Density comparison</Link>
        </p>
      </section>
    </main>
  );
}
