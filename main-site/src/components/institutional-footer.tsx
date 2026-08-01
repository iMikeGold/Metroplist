import Image from "next/image";

const groups = [
  {
    title: "Metroplist",
    links: [
      ["About", "/about/"],
      ["Contact", "/contact/"],
      ["Partnerships and data enquiries", "/contact/?topic=partnerships"],
    ],
  },
  {
    title: "Data",
    links: [
      ["Data sources", "https://app.metroplist.com/data-sources"],
      ["Methodology", "https://app.metroplist.com/methodology"],
      ["Coverage", "https://app.metroplist.com/coverage"],
      ["Data quality", "/data-quality/"],
      ["Corrections", "/corrections/"],
      ["Licensing and reuse", "/licensing/"],
      ["Report a data issue", "https://app.metroplist.com/report-data-issue"],
    ],
  },
  {
    title: "Trust",
    links: [
      ["Privacy", "/privacy/"],
      ["Cookies", "/cookies/"],
      ["Terms", "/terms/"],
      ["Accessibility", "/accessibility/"],
      ["Responsible data use", "/responsible-data-use/"],
    ],
  },
];

export function InstitutionalFooter() {
  return (
    <footer className="border-t border-graphite/10 bg-white px-5 py-12 md:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_2fr]">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/assets/brand/logos/metroplist-dv4-grey-teal.svg"
              alt=""
              width={30}
              height={30}
            />
            <span className="font-medium tracking-[0.06em] text-graphite">Metroplist</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate">
            A connected view of places, measurements and the relationships between them.
          </p>
        </div>
        <nav className="grid gap-8 sm:grid-cols-3" aria-label="Footer navigation">
          {groups.map((group) => (
            <section key={group.title}>
              <h2 className="text-sm font-semibold text-graphite">{group.title}</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate">
                {group.links.map(([label, href]) => (
                  <li key={label}>
                    <a className="hover:text-graphite" href={href}>{label}</a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>
      </div>
    </footer>
  );
}
