"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  ["Explore", "#explore"],
  ["System", "#system"],
  ["Stories", "#stories"],
  ["Method", "#method"]
];

export default function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-graphite/15 bg-white/60 text-graphite transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ocean"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
      </button>

      {isOpen && (
        <div
          id="mobile-navigation"
          className="absolute inset-x-0 top-full border-b border-graphite/10 bg-soft-white/98 px-5 py-3 shadow-lg backdrop-blur-xl"
        >
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2">
            {links.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-slate transition hover:bg-graphite/5 hover:text-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ocean"
                onClick={() => setIsOpen(false)}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
