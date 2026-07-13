import {
  ArrowUpRight,
  BookOpenText,
  Braces,
  CircleDot,
  Database,
  FlaskConical,
  GitBranch,
  Layers3,
  Map,
  Network,
  Radar,
  Sparkles,
  Telescope
} from "lucide-react";

const explorations = [
  "Population change",
  "Global cities",
  "Music evolution",
  "Sports intelligence",
  "Economic movement",
  "Technology adoption",
  "Cultural patterns",
  "Climate adaptation"
];

const categories = [
  ["Society", "Population, communities, migration, human behaviour."],
  ["Cities", "Infrastructure, growth, movement, urban systems."],
  ["Economy", "Markets, trade, industries, resources."],
  ["Culture", "Music, film, sport, creative movements."],
  ["Science", "Research, innovation, discovery."],
  ["Technology", "Networks, AI, digital transformation."]
];

const method = ["Observe", "Collect", "Connect", "Visualise", "Explain"];

const layers = [
  ["Data sources", "Government data, open archives, scientific research, culture, history, and user contributions."],
  ["Normalisation", "Cleaning, classification, metadata, validation, and source memory."],
  ["Relationship engine", "Similarity, clusters, movement, influence, anomalies, and connected entities."],
  ["Intelligence layer", "Insights, hypotheses, visualisations, simulations, and editorial prompts."],
  ["Metroplist experience", "Maps, graphs, articles, collections, and explorable stories."]
];

const stories = [
  ["How cities breathe", "A field note on movement, density, infrastructure, and the daily pulse of urban life."],
  ["Where creativity concentrates", "Mapping scenes, venues, collaborators, universities, labels, studios, and cultural gravity."],
  ["The hidden geography of opportunity", "What employment, housing, transport, education, and migration reveal when read together."]
];

function Constellation() {
  const nodes = [
    ["London", "18%", "22%"],
    ["Migration", "38%", "16%"],
    ["Housing", "57%", "28%"],
    ["Music", "75%", "19%"],
    ["Transport", "28%", "48%"],
    ["Climate", "52%", "58%"],
    ["Sport", "72%", "62%"],
    ["Opportunity", "42%", "80%"]
  ];

  return (
    <div className="relative min-h-[430px] overflow-hidden border-y border-white/10 bg-ink text-white md:min-h-[560px]">
      <div className="absolute inset-0 metro-grid" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink to-transparent" />
      <svg className="absolute inset-0 h-full w-full opacity-70" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M18 22 L38 16 L57 28 L75 19 M18 22 L28 48 L52 58 L72 62 M28 48 L42 80 L52 58 M38 16 L52 58 M57 28 L72 62 L42 80" stroke="rgba(33,198,168,.52)" strokeWidth=".22" fill="none" />
        <path d="M8 72 C26 58 44 88 64 50 S88 40 96 28" stroke="rgba(240,108,63,.55)" strokeWidth=".18" fill="none" strokeDasharray="1 1.6" />
        <path d="M2 42 C30 30 55 38 98 12" stroke="rgba(79,140,255,.42)" strokeWidth=".16" fill="none" />
      </svg>
      {nodes.map(([label, left, top], index) => (
        <div
          key={label}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left, top }}
        >
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[.08] px-3 py-2 text-xs shadow-glow backdrop-blur">
            <span className={`h-2.5 w-2.5 rounded-full ${index % 3 === 0 ? "bg-signal" : index % 3 === 1 ? "bg-ember" : "bg-chart"}`} />
            <span className="font-mono uppercase tracking-normal text-white/86">{label}</span>
          </div>
        </div>
      ))}
      <div className="relative z-10 mx-auto flex min-h-[430px] max-w-7xl items-end px-5 py-10 md:min-h-[560px] md:px-8">
        <div className="max-w-3xl pb-10">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.08] px-3 py-2 font-mono text-xs uppercase text-signal backdrop-blur">
            <Radar size={15} /> Foundation phase 2026
          </p>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
            Metroplist
          </h1>
          <p className="mt-5 max-w-2xl text-xl leading-8 text-white/78">
            A living index of the world through data. Mapping the relationships between people, places, systems, and ideas.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#observatory" className="inline-flex items-center gap-2 rounded-md bg-signal px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white">
              Enter the observatory <ArrowUpRight size={17} />
            </a>
            <a href="#engine" className="inline-flex items-center gap-2 rounded-md border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/10">
              Preview the engine
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/82 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <a href="#" className="font-mono text-sm font-bold uppercase tracking-normal">Metroplist</a>
          <div className="hidden items-center gap-6 text-sm text-ink/70 md:flex">
            <a href="#explorations" className="hover:text-ink">Explorations</a>
            <a href="#method" className="hover:text-ink">Method</a>
            <a href="#engine" className="hover:text-ink">Engine</a>
            <a href="#archive" className="hover:text-ink">Archive</a>
          </div>
        </nav>
      </header>

      <Constellation />

      <section id="observatory" className="mx-auto grid max-w-7xl gap-10 px-5 py-20 md:grid-cols-[.9fr_1.1fr] md:px-8">
        <div>
          <p className="section-kicker"><Telescope size={16} /> The website is the observatory</p>
          <h2 className="section-title">The place where discovery begins.</h2>
        </div>
        <div className="space-y-6 text-lg leading-8 text-ink/76">
          <p>
            Metroplist begins as a public archive, editorial home, research journal, and showcase of discoveries. It is designed to build the language and credibility of the platform while the deeper intelligence system is refined behind the scenes.
          </p>
          <p>
            The goal is not another dashboard. The goal is a digital publication with the curiosity of a research notebook, the clarity of data journalism, and the visual pull of an observatory.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {["Discover", "Explore", "Understand"].map((item) => (
              <div key={item} className="border-l-2 border-signal bg-white/50 px-4 py-3 font-mono text-sm uppercase text-ink/82">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="explorations" className="border-y border-ink/10 bg-white/60">
        <div className="mx-auto max-w-7xl px-5 py-18 md:px-8">
          <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="section-kicker"><Map size={16} /> Current explorations</p>
              <h2 className="section-title">A constantly evolving collection of investigations.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-ink/62">Each subject is treated as an entry point into wider systems, not as an isolated topic.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {explorations.map((item, index) => (
              <article key={item} className="group rounded-md border border-ink/10 bg-paper p-5 transition hover:-translate-y-1 hover:border-ink/25">
                <div className="mb-8 flex items-center justify-between">
                  <CircleDot className={index % 2 ? "text-ember" : "text-signal"} size={18} />
                  <span className="font-mono text-xs text-ink/44">0{index + 1}</span>
                </div>
                <h3 className="text-lg font-semibold">{item}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="method" className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="grid gap-12 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <p className="section-kicker"><FlaskConical size={16} /> Research method</p>
            <h2 className="section-title">Curiosity becomes structure.</h2>
            <p className="mt-5 max-w-xl leading-7 text-ink/68">Every investigation moves from signal to story through a repeatable editorial and analytical process.</p>
          </div>
          <div className="grid gap-3">
            {method.map((item, index) => (
              <div key={item} className="flex items-center gap-5 border-b border-ink/10 pb-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-sm text-paper">{index + 1}</span>
                <div>
                  <h3 className="text-xl font-semibold">{item}</h3>
                  <p className="text-sm text-ink/58">{index === 0 ? "Find interesting information." : index === 1 ? "Gather datasets and source context." : index === 2 ? "Identify relationships and influence." : index === 3 ? "Create understanding through maps, graphs, and timelines." : "Tell the story without flattening the complexity."}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="engine" className="bg-ink text-white">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8">
          <p className="section-kicker text-signal"><Network size={16} /> Future core system</p>
          <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr]">
            <div>
              <h2 className="section-title text-white">The Relationship Engine is the centre being built toward.</h2>
              <p className="mt-5 leading-7 text-white/68">
                Traditional databases ask, "What is this thing?" Metroplist asks, "What does this thing connect to?" The first site prepares the public surface for that intelligence layer without claiming the engine is finished today.
              </p>
            </div>
            <div className="grid gap-3">
              {layers.map(([title, body], index) => (
                <div key={title} className="grid gap-4 rounded-md border border-white/12 bg-white/[.055] p-5 sm:grid-cols-[130px_1fr]">
                  <div className="font-mono text-xs uppercase text-signal">Layer {index + 1}</div>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-white/64">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="archive" className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="mb-9 grid gap-8 md:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="section-kicker"><BookOpenText size={16} /> Data stories</p>
            <h2 className="section-title">Every dataset has a story.</h2>
          </div>
          <p className="text-lg leading-8 text-ink/70">The editorial layer combines data, context, curiosity, and explanation. The archive starts as a publication, then evolves into an explorable knowledge graph.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {stories.map(([title, body]) => (
            <article key={title} className="rounded-md border border-ink/10 bg-white/64 p-6">
              <Sparkles className="mb-8 text-ember" size={20} />
              <h3 className="text-xl font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-ink/62">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-ink/10 bg-white/60">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 md:grid-cols-2 lg:grid-cols-3 md:px-8">
          {categories.map(([title, body]) => (
            <div key={title} className="flex gap-4">
              <Layers3 className="mt-1 shrink-0 text-signal" size={19} />
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-ink/62">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-md bg-ink p-6 text-white md:col-span-2">
            <Braces className="mb-8 text-signal" />
            <h2 className="text-3xl font-semibold">Repository philosophy</h2>
            <p className="mt-4 max-w-2xl leading-7 text-white/70">The website is the first public layer. The repo is already arranged to welcome data, research, visualisations, and future intelligence experiments as the project matures.</p>
          </div>
          <div className="rounded-md border border-ink/10 bg-white p-6">
            <Database className="mb-8 text-chart" />
            <h3 className="text-xl font-semibold">Definition</h3>
            <p className="mt-3 text-sm leading-6 text-ink/64">A living data intelligence platform that transforms information into exploration, relationships into understanding, and datasets into stories.</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink/10 px-5 py-8 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-ink/58 md:flex-row">
          <p className="font-mono uppercase">Map Everything. Understand Anything.</p>
          <p className="flex items-center gap-2"><GitBranch size={15} /> Foundation edition 2026</p>
        </div>
      </footer>
    </main>
  );
}
