import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/map", label: "Atlas" },
  { href: "/compare", label: "Compare" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <nav className="site-navigation" aria-label="Primary navigation">
        <Link className="site-brand" href="/" aria-label="Metroplist home">
          <Image
            src="/assets/brand/logos/metroplist-d-monochrome.svg"
            alt=""
            width={38}
            height={38}
            priority
          />
          <span>Metroplist</span>
        </Link>
        <div className="site-links">
          {links.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
          <a href="https://metroplist.com">About Metroplist</a>
        </div>
      </nav>
    </header>
  );
}
