import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { institutionalPages } from "@/content/institutional-pages";

export function generateStaticParams() {
  return Object.keys(institutionalPages).map((institutionalSlug) => ({
    institutionalSlug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ institutionalSlug: string }>;
}): Promise<Metadata> {
  const { institutionalSlug } = await params;
  const page = institutionalPages[institutionalSlug];
  if (!page) return {};
  return {
    title: `${page.title} | Metroplist`,
    description: page.summary,
    alternates: { canonical: `/${institutionalSlug}/` },
  };
}

export default async function InstitutionalPage({
  params,
}: {
  params: Promise<{ institutionalSlug: string }>;
}) {
  const { institutionalSlug } = await params;
  const page = institutionalPages[institutionalSlug];
  if (!page) notFound();

  return (
    <main className="policy-page">
      <header className="policy-intro">
        <p className="section-kicker">Metroplist</p>
        <h1>{page.title}</h1>
        <p>{page.summary}</p>
      </header>
      <div className="policy-sections">
        {page.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.links?.length ? (
              <ul>
                {section.links.map((link) => (
                  <li key={link.href}><a href={link.href}>{link.label}</a></li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </main>
  );
}
