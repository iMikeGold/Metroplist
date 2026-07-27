import { Menu, X } from "lucide-react";

const links = [
  ["Explore", "#explore"],
  ["System", "#system"],
  ["Stories", "#stories"],
  ["Method", "#method"]
];

export default function MobileNavigation() {
  return (
    <details className="group md:hidden">
      <summary
        className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-md border border-graphite/15 bg-white/60 text-graphite transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ocean [&::-webkit-details-marker]:hidden"
        aria-label="Toggle navigation menu"
      >
        <Menu aria-hidden="true" size={22} className="group-open:hidden" />
        <X aria-hidden="true" size={22} className="hidden group-open:block" />
      </summary>

      <div
        id="mobile-navigation"
        className="absolute inset-x-0 top-full border-b border-graphite/10 bg-soft-white px-5 py-3 shadow-lg"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2">
          {links.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-slate transition hover:bg-graphite/5 hover:text-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ocean"
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </details>
  );
}
