import type { Metadata } from "next";
import { ComparisonComposer } from "./comparison-composer";

export const metadata: Metadata = { title: "Compare places" };

export default function ComparePlacesPage() {
  return (
    <main>
      <p className="eyebrow">Comparison composer</p>
      <h1>Compare places</h1>
      <p className="lede">
        Resolve two canonical places, then compare the verified indicators
        Metroplist currently holds for both.
      </p>
      <ComparisonComposer />
    </main>
  );
}
