import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import MobileNavigation from "@/app/mobile-navigation";

const LOGO = "/assets/brand/logos/metroplist-dv4-grey-teal.svg";

export function InstitutionalHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-graphite/10 bg-soft-white/88 backdrop-blur-xl">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8"
        aria-label="Primary navigation"
      >
        <Link href="/" className="flex items-center gap-3" aria-label="Metroplist home">
          <Image src={LOGO} alt="" width={34} height={34} className="h-8 w-8" priority />
          <span className="text-lg font-medium tracking-[0.06em]">Metroplist</span>
        </Link>
        <div className="hidden items-center gap-7 text-sm text-slate md:flex">
          <Link href="/#explore" className="hover:text-graphite">Explore</Link>
          <Link href="/#system" className="hover:text-graphite">System</Link>
          <Link href="/#stories" className="hover:text-graphite">Stories</Link>
          <Link href="/data-and-trust/" className="hover:text-graphite">Data &amp; Trust</Link>
          <a
            href="https://app.metroplist.com"
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-graphite px-4 font-semibold text-soft-white transition hover:bg-deep-ocean"
          >
            Explore Metroplist <ArrowUpRight size={16} />
          </a>
        </div>
        <MobileNavigation />
      </nav>
    </header>
  );
}
