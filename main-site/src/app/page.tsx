import Image from "next/image";
import {
  ArrowUpRight,
  BookOpenText,
  CircleDot,
  Database,
  Globe2,
  Layers3,
  Map,
  Network,
  Orbit,
  Search,
  Sparkles,
  Telescope
} from "lucide-react";

const imageSet = {
  hero: "/assets/images/web/connected-world-map.webp",
  gallery: "/assets/images/web/luminous-white-gallery.webp",
  dataWall: "/assets/images/web/interactive-data-wall.webp",
  transit: "/assets/images/web/urban-transit-network.webp",
  earth: "/assets/images/web/digital-earth-network.webp",
  map: "/assets/images/web/interactive-map-exploration.webp"
};

const explorations = [
  "Population change",
  "Global cities",
  "Human movement",
  "Technology adoption",
  "Cultural patterns",
  "Economic geography",
  "Sports intelligence",
  "Creative concentration"
];

const stories = [
  ["How cities breathe", "Movement, density, infrastructure and the living rhythm of urban systems."],
  ["Where creativity concentrates", "The geography of scenes, venues, education, media and cultural gravity."],
  ["The evolution of human movement", "How migration, opportunity, transport and identity shape one another."]
];

const systems = [
  ["Data sources", "Government data, open data, scientific research, economic signals, cultural archives and public records."],
  ["System database", "Entities, attributes, timelines and source memory arranged so places, people, events and ideas can be compared."],
  ["Relationship graph", "Connections between datasets reveal clusters, movements, similarities, pressure points and influence."],
  ["Visual intelligence", "Maps, networks, timelines, heatmaps and stories turn complexity into something people can explore."]
];

const categories = [
  ["Society", "Population, communities, migration and behaviour."],
  ["Cities", "Infrastructure, density, movement and urban systems."],
  ["Economy", "Markets, trade, industries and resources."],
  ["Culture", "Music, film, sport and creative movements."],
  ["Science", "Research, discovery and environmental systems."],
  ["Technology", "Networks, AI and digital transformation."]
];

const method = ["Observe", "Collect", "Connect", "Visualise", "Explain"];

export default function Home() {
  return (
    <main className="min-h-screen bg-soft-white text-graphite">
      <section className="relative isolate flex min-h-screen items-end overflow-hidden pt-24">
        <Image
          src={imageSet.hero}
          alt="A connected world map made of glowing routes and data pathways"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-graphite/35 via-graphite/12 to-graphite/82" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-soft-white to-transparent" />
        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 px-5 pb-20 md:px-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
          <div className="max-w-4xl text-white">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-4 py-2 font-mono text-xs uppercase backdrop-blur">
              <Globe2 size={15} /> The World, Connected
            </p>
            <h1 className="text-5xl font-semibold leading-[1.02] tracking-normal sm:text-7xl lg:text-8xl">
              Map Everything. Understand Anything.
            </h1>
            <p className="mt-6 max-w-2xl rounded-md bg-graphite/34 px-4 py-3 text-xl leading-8 text-white shadow-glow backdrop-blur-sm">
              Metroplist is a living data intelligence platform revealing the hidden patterns shaping people, places, systems and ideas.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="https://app.metroplist.com" className="inline-flex items-center gap-2 rounded-md bg-soft-white px-5 py-3 text-sm font-semibold text-graphite transition hover:bg-white">
                Explore the Atlas <ArrowUpRight size={17} />
              </a>
              <a href="#system" className="inline-flex items-center gap-2 rounded-md border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                See the system
              </a>
            </div>
          </div>
          <div className="rounded-md border border-white/20 bg-white/12 p-5 text-white shadow-2xl backdrop-blur-md">
            <p className="font-mono text-xs uppercase text-white/70">Metroplist principle</p>
            <p className="mt-4 text-2xl font-semibold leading-tight">
              Every dataset is incomplete until it is connected.
            </p>
          </div>
        </div>
      </section>

      <section id="explore" className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-end">
          <div>
            <p className="section-kicker"><Telescope size={16} /> A place where curiosity lives</p>
            <h2 className="section-title">The world already has the data. Metroplist reveals the connections.</h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-slate">
            Population movements, culture, infrastructure, economics, sport, technology and environment are usually studied in separate rooms. Metroplist brings them into one navigable atlas of relationships.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {explorations.map((item, index) => (
            <article key={item} className="rounded-md border border-graphite/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-steel-blue/50">
              <div className="mb-7 flex items-center justify-between">
                <CircleDot className={index % 3 === 0 ? "text-mineral-teal" : index % 3 === 1 ? "text-copper-mid" : "text-deep-ocean"} size={18} />
                <span className="font-mono text-xs text-slate/60">0{index + 1}</span>
              </div>
              <h3 className="text-lg font-semibold">{item}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-20 md:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div className="relative aspect-[4/3] overflow-hidden rounded-md">
            <Image src={imageSet.dataWall} alt="People exploring a large interactive data wall" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <div>
            <p className="section-kicker"><Database size={16} /> The world&apos;s most curious database</p>
            <h2 className="section-title">A database that points toward better questions.</h2>
            <p className="mt-6 text-lg leading-8 text-slate">
              Search tells you what is known. Metroplist is designed around what becomes visible when knowledge is connected: patterns, pressure, influence, movement and consequence.
            </p>
            <blockquote className="mt-8 border-l-4 border-copper-mid pl-5 text-2xl font-semibold leading-tight text-graphite">
              The value is not the data point. The value is the relationship.
            </blockquote>
          </div>
        </div>
      </section>

      <section id="system" className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="section-kicker"><Network size={16} /> Connected intelligence</p>
          <h2 className="section-title">From isolated facts to a living map of relationships.</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          {systems.map(([title, body], index) => (
            <article key={title} className="rounded-md border border-graphite/10 bg-white p-6">
              <span className="font-mono text-xs uppercase text-steel-blue">Layer {index + 1}</span>
              <h3 className="mt-5 text-xl font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-graphite text-white">
        <div className="absolute inset-0 opacity-35">
          <Image src={imageSet.gallery} alt="" fill sizes="100vw" className="object-cover" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-24 md:px-8 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="section-kicker text-atlas-light"><Sparkles size={16} /> Visual intelligence</p>
            <h2 className="section-title text-white">Not a spreadsheet. A museum of living systems.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {["Metro maps", "Timelines", "Heatmaps", "Knowledge graphs"].map((item) => (
              <div key={item} className="rounded-md border border-white/15 bg-white/10 p-5 backdrop-blur">
                <Orbit className="mb-8 text-atlas-light" size={22} />
                <h3 className="text-xl font-semibold">{item}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="stories" className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="mb-10 grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <p className="section-kicker"><BookOpenText size={16} /> Data stories</p>
            <h2 className="section-title">Every graph has a human consequence.</h2>
          </div>
          <p className="text-lg leading-8 text-slate">
            Metroplist turns datasets into stories about how the world moves, grows, clusters, adapts and remembers.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {stories.map(([title, body]) => (
            <article key={title} className="rounded-md border border-graphite/10 bg-white p-6">
              <Map className="mb-8 text-copper-mid" size={22} />
              <h3 className="text-xl font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-20 md:px-8 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
          <div>
            <p className="section-kicker"><Layers3 size={16} /> Field notes</p>
            <h2 className="section-title">Society, cities, economy, culture, science and technology in one frame.</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {categories.map(([title, body]) => (
                <div key={title} className="border-t border-graphite/10 pt-4">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate">{body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative aspect-[4/5] overflow-hidden rounded-md">
              <Image src={imageSet.earth} alt="A digital earth network visualisation" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
            </div>
            <div className="relative aspect-[4/5] overflow-hidden rounded-md sm:translate-y-10">
              <Image src={imageSet.transit} alt="An abstract urban transit network" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section id="method" className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="section-kicker"><Search size={16} /> Research method</p>
            <h2 className="section-title">Curiosity, collected and connected.</h2>
          </div>
          <div className="grid gap-3">
            {method.map((item, index) => (
              <div key={item} className="flex items-center gap-5 border-b border-graphite/10 pb-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-graphite font-mono text-sm text-soft-white">{index + 1}</span>
                <h3 className="text-xl font-semibold">{item}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
