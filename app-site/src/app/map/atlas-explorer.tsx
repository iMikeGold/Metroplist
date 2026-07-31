"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
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

export function AtlasExplorer() {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<PlaceDetail | null>(null);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [message, setMessage] = useState("Search the canonical registry.");

  useEffect(() => {
    if (!container.current || map.current) return;
    let disposed = false;
    void import("maplibre-gl").then(({ Map, NavigationControl }) => {
      if (disposed || !container.current) return;
      map.current = new Map({
        container: container.current,
        style: "https://demotiles.maplibre.org/style.json",
        center: [0, 18],
        zoom: 1.35,
        attributionControl: {
          customAttribution:
            '<a href="https://maplibre.org/" target="_blank">MapLibre</a> · <a href="https://demotiles.maplibre.org/" target="_blank">Demo tiles</a>',
        },
      });
      map.current.addControl(new NavigationControl(), "top-right");
    });
    return () => {
      disposed = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  async function search(event: FormEvent) {
    event.preventDefault();
    const response = await fetch(`/api/places?q=${encodeURIComponent(query)}&limit=12`);
    if (!response.ok) {
      setCandidates([]);
      setMessage("Place search is temporarily unavailable.");
      return;
    }
    const payload = await response.json();
    setCandidates(payload.candidates ?? []);
    setMessage(
      payload.candidates?.length
        ? `${payload.candidates.length} candidate${payload.candidates.length === 1 ? "" : "s"} found.`
        : "No canonical place matched this prefix.",
    );
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
    if (hint.available && hint.latitude != null && hint.longitude != null && map.current) {
      map.current.flyTo({ center: [hint.longitude, hint.latitude], zoom: 6 });
    }
    setMessage(
      hint.available && hint.city
        ? `Coarse network hint: ${hint.city}. Confirmation is still required.`
        : hint.available
          ? "No city-level coarse hint was available. Confirmation is still required."
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
          Use coarse location hint
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
                {candidate.placeKind}
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
        <div ref={container} className="atlas-map" />
        <p className="map-disclosure">
          Contextual MapLibre demo basemap. Display boundaries are not Metroplist
          statistical boundary evidence.
        </p>
      </section>
    </div>
  );
}
