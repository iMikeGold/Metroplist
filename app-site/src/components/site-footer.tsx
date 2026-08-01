import Link from "next/link";

const groups = [
  {
    title: "Metroplist",
    links: [
      ["Explore", "/map"],
      ["Compare", "/compare"],
      ["About", "https://metroplist.com/about/"],
      ["Contact", "https://metroplist.com/contact/"],
    ],
  },
  {
    title: "Data",
    links: [
      ["Data sources", "/data-sources"],
      ["Methodology", "/methodology"],
      ["Coverage", "/coverage"],
      ["Report a data issue", "/report-data-issue"],
    ],
  },
  {
    title: "Trust",
    links: [
      ["Data & Trust", "https://metroplist.com/data-and-trust/"],
      ["Privacy", "https://metroplist.com/privacy/"],
      ["Terms", "https://metroplist.com/terms/"],
      ["Accessibility", "https://metroplist.com/accessibility/"],
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="app-footer">
      <nav aria-label="Footer navigation">
        {groups.map((group) => (
          <section key={group.title}>
            <h2>{group.title}</h2>
            <ul>
              {group.links.map(([label, href]) => (
                <li key={label}>
                  {href.startsWith("http")
                    ? <a href={href}>{label}</a>
                    : <Link href={href}>{label}</Link>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>
      <p>Metroplist · Places, measurements and comparisons</p>
    </footer>
  );
}
