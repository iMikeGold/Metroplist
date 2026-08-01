import type { ReactNode } from "react";

export function InformationPage({
  eyebrow,
  title,
  summary,
  children,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <main className="information-page">
      <header>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="lede">{summary}</p>
      </header>
      <div className="information-sections">{children}</div>
    </main>
  );
}
