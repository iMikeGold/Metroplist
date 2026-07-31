"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { requestLocationHint } from "@/modules/location";

interface Candidate {
  id: string;
  canonicalName: string;
  placeKind: string;
  parentName: string | null;
  geographyTypes: string[];
}

interface PlaceDetail extends Candidate {
  status: string;
  centroid: { latitude: number; longitude: number } | null;
  identifiers: Array<{ authority: string; scheme: string; identifier: string }>;
}

interface Indicator {
  id: string;
  canonicalName: string;
  latestValue: number | null;
  latestYear: number | null;
  unit: string;
  estimate: boolean;
}

export function AtlasExplorer({ initialQuery = "" }: { initialQuery?: string }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<PlaceDetail | null>(null);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [message, setMessage] = useState("Search the canonical registry.");
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    if (!container.current || map.current) return;
    let disposed = false;
    void import("maplibre-gl").then(({ Map, NavigationControl }) => {
      if (disposed || !container.current) return;
      const atlasMap = new Map({
        container: container.current,
        style: {
          version: 8,
          sources: {
            openStreetMap: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution:
                '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
            },
          },
          layers: [
            {
              id: "open-street-map",
              type: "raster",
              source: "openStreetMap",
            },
          ],
        },
        center: [0, 18],
        zoom: 1.35,
        attributionControl: {
          customAttribution:
            '<a href="https://maplibre.org/" target="_blank">MapLibre</a>',
        },
      });
      atlasMap.on("idle", () => {
        if (atlasMap.isSourceLoaded("openStreetMap")) setMapStatus("ready");
      });
      atlasMap.on("error", (event) => {
        console.error("Metroplist Atlas map source error", event.error);
        setMapStatus("error");
      });
      atlasMap.addControl(new NavigationControl(), "top-right");
      map.current = atlasMap;
    });
    return () => {
      disposed = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  const runSearch = useCallback(async (term: string, locationCandidate = false) => {
    const submittedQuery = term.trim();
    if (!submittedQuery) return;
    setQuery(submittedQuery);
    const response = await fetch(`/api/places?q=${encodeURIComponent(submittedQuery)}&limit=12`);
    if (!response.ok) {
      setCandidates([]);
      setMessage("Place search could not connect to the Metroplist registry.");
      return;
    }
    const payload = await response.json();
    setCandidates(payload.candidates ?? []);
    setMessage(
      payload.candidates?.length
        ? locationCandidate
          ? `Your approximate location appears to be ${submittedQuery}. Choose the matching place.`
          : `${payload.candidates.length} candidate${payload.candidates.length === 1 ? "" : "s"} found.`
        : "No canonical place matched this prefix.",
    );
  }, []);

  useEffect(() => {
    if (!initialQuery) return;
    const searchTimer = window.setTimeout(() => {
      void runSearch(initialQuery);
    }, 0);
    return () => window.clearTimeout(searchTimer);
  }, [initialQuery, runSearch]);

  async function search(event: FormEvent) {
    event.preventDefault();
    await runSearch(query);
  }

  async function selectPlace(placeId: string) {
    const response = await fetch(`/api/places/${encodeURIComponent(placeId)}/indicators`);
    if (!response.ok) {
      setMessage("This place summary is temporarily unavailable.");
      return;
    }
    const payload = await response.json();
    setSelected(payload.place);
    setIndicators(payload.indicators ?? []);
    if (payload.place?.centroid && map.current) {
      map.current.flyTo({
        center: [
          payload.place.centroid.longitude,
          payload.place.centroid.latitude,
        ],
        zoom: payload.place.placeKind === "country" ? 4 : 9,
      });
    }
  }

  async function useLocationHint() {
    const hint = await requestLocationHint();
    const candidateText = hint.available
      ? hint.city ?? hint.region ?? hint.countryCode
      : null;
    if (candidateText) {
      await runSearch(candidateText, true);
      return;
    }
    setMessage(
      hint.available
        ? "Your approximate location could not be matched to a place."
        : hint.reason,
    );
  }

  return (
    <div className="atlas-shell">
      <aside className="atlas-sidebar">
        <header>
          <p className="eyebrow">Metroplist Atlas</p>
          <h1>World registry</h1>
        </header>
        <form className="atlas-search" onSubmit={search}>
          <label htmlFor="place-query">Place name or official identifier</label>
          <div>
            <input
              id="place-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="London, E09000011, Japan"
              required
            />
            <button type="submit">Search</button>
          </div>
        </form>
        <button className="secondary-action" type="button" onClick={useLocationHint}>
          Use my approximate location
        </button>
        <p className="atlas-message" role="status">{message}</p>
        <div className="atlas-results">
          {candidates.map((candidate) => (
            <button
              className="place-result"
              key={candidate.id}
              type="button"
              onClick={() => selectPlace(candidate.id)}
            >
              <strong>{candidate.canonicalName}</strong>
              <span>
                {candidate.geographyTypes.join(", ") || candidate.placeKind}
                {candidate.parentName ? ` · ${candidate.parentName}` : ""}
              </span>
            </button>
          ))}
        </div>
        {selected ? (
          <section className="place-summary">
            <p className="eyebrow">Selected place</p>
            <h2>{selected.canonicalName}</h2>
            <p>{selected.geographyTypes.join(", ") || selected.placeKind}</p>
            <dl>
              {indicators.map((indicator) => (
                <div key={indicator.id}>
                  <dt>{indicator.canonicalName}</dt>
                  <dd>
                    {indicator.latestValue?.toLocaleString() ?? "No numeric value"}
                    {" "}{indicator.unit}
                    {indicator.latestYear ? ` (${indicator.latestYear})` : ""}
                    {indicator.estimate ? " · estimate" : ""}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
      </aside>
      <section className="atlas-map-band" aria-label="Interactive world map">
        <div
          ref={container}
          className="atlas-map"
          data-map-state={mapStatus}
        />
        {mapStatus === "error" ? (
          <p className="map-error" role="status">
            The contextual map could not be loaded. Place search remains available.
          </p>
        ) : null}
        <details className="map-information">
          <summary aria-label="Map information">i</summary>
          <p>Map shown for orientation. Verified statistical boundaries are identified separately.</p>
        </details>
      </section>
    </div>
  );
}
