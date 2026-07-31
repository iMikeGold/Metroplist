import type { Metadata } from "next";
import { ComparisonComposer } from "./comparison-composer";

export const metadata: Metadata = { title: "Compare places" };

export default function ComparePlacesPage() {
  return (
    <main>
      <p className="eyebrow">Compare</p>
      <h1>Compare places</h1>
      <p className="lede">
        Choose two places and compare measurements from a shared year and
        compatible method.
      </p>
      <ComparisonComposer />
    </main>
  );
}
