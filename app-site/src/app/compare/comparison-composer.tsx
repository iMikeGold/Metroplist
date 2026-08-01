"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  explainEvidenceIncompatibility,
  findNewestCompatibleEvidencePairs,
  type ComparableEvidence,
} from "@/modules/comparisons/evidence-compatibility";
import { publicPlaceType } from "@/modules/places/presentation";

interface Candidate {
  id: string;
  slug: string;
  canonicalName: string;
  placeKind: string;
  parentName: string | null;
  geographyTypes: string[];
}

function updateComparisonUrl(origin: Candidate | null, target: Candidate | null) {
  const parameters = new URLSearchParams();
  if (origin) parameters.set("origin", origin.slug);
  if (origin && target) parameters.set("target", target.slug);
  const query = parameters.toString();
  window.history.replaceState(null, "", query ? `/compare?${query}` : "/compare");
}

function PlacePicker({
  label,
  query,
  onQueryChange,
  onSelect,
}: {
  label: string;
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (candidate: Candidate) => void;
}) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [message, setMessage] = useState("");

  async function search(event: FormEvent) {
    event.preventDefault();
    const response = await fetch(`/api/places?q=${encodeURIComponent(query)}&limit=8`);
    if (!response.ok) {
      setMessage("Place search could not connect to the Metroplist registry.");
      setCandidates([]);
      return;
    }
    const payload = await response.json();
    setCandidates(payload.candidates ?? []);
    setMessage(payload.ambiguous ? "Choose the intended geography." : "");
  }

  return (
    <section className="comparison-picker">
      <form onSubmit={search}>
        <label>
          {label}
          <input value={query} onChange={(event) => onQueryChange(event.target.value)} required />
        </label>
        <button type="submit">Find</button>
      </form>
      {message ? <p>{message}</p> : null}
      <div className="atlas-results">
        {candidates.map((candidate) => (
          <button
            className="place-result"
            key={candidate.id}
            type="button"
            onClick={() => {
              onSelect(candidate);
              setCandidates([]);
              onQueryChange(candidate.canonicalName);
            }}
          >
            <strong>{candidate.canonicalName}</strong>
            <span>
              {publicPlaceType(candidate.geographyTypes, candidate.placeKind)}
              {candidate.parentName ? ` · ${candidate.parentName}` : ""}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function ComparisonComposer({
  initialOrigin = null,
  initialTarget = null,
}: {
  initialOrigin?: Candidate | null;
  initialTarget?: Candidate | null;
}) {
  const [origin, setOrigin] = useState<Candidate | null>(initialOrigin);
  const [target, setTarget] = useState<Candidate | null>(initialTarget);
  const [originQuery, setOriginQuery] = useState(initialOrigin?.canonicalName ?? "");
  const [targetQuery, setTargetQuery] = useState(initialTarget?.canonicalName ?? "");
  const [originEvidence, setOriginEvidence] = useState<ComparableEvidence[]>([]);
  const [targetEvidence, setTargetEvidence] = useState<ComparableEvidence[]>([]);
  const [selectedObservationIds, setSelectedObservationIds] = useState("");

  useEffect(() => {
    if (!origin) return;
    void fetch(`/api/places/${encodeURIComponent(origin.id)}/indicators`)
      .then((response) => response.json())
      .then((payload) => setOriginEvidence(payload.evidence ?? []))
      .catch(() => setOriginEvidence([]));
  }, [origin]);

  useEffect(() => {
    if (!target) return;
    void fetch(`/api/places/${encodeURIComponent(target.id)}/indicators`)
      .then((response) => response.json())
      .then((payload) => setTargetEvidence(payload.evidence ?? []))
      .catch(() => setTargetEvidence([]));
  }, [target]);

  const compatiblePairs = useMemo(() => {
    if (!origin || !target) return [];
    return findNewestCompatibleEvidencePairs(
      originEvidence,
      targetEvidence,
    );
  }, [origin, originEvidence, target, targetEvidence]);
  const incompatibilityReasons = useMemo(
    () =>
      origin && target && compatiblePairs.length === 0
        ? explainEvidenceIncompatibility(
            originEvidence,
            targetEvidence,
          )
        : [],
    [compatiblePairs.length, origin, originEvidence, target, targetEvidence],
  );

  const selectedPair = compatiblePairs.find(
    (pair) =>
      `${pair.origin.observationId}:${pair.target.observationId}` === selectedObservationIds,
  );

  return (
    <div className="comparison-composer">
      <PlacePicker
        label="First place"
        query={originQuery}
        onQueryChange={setOriginQuery}
        onSelect={(candidate) => {
          setOrigin(candidate);
          setOriginEvidence([]);
          setSelectedObservationIds("");
          updateComparisonUrl(candidate, target);
        }}
      />
      <PlacePicker
        label="Second place"
        query={targetQuery}
        onQueryChange={setTargetQuery}
        onSelect={(candidate) => {
          setTarget(candidate);
          setTargetEvidence([]);
          setSelectedObservationIds("");
          updateComparisonUrl(origin, candidate);
        }}
      />
      <section className="comparison-selection" aria-live="polite">
        <p>
          {origin?.canonicalName ?? "Choose a first place"} →{" "}
          {target?.canonicalName ?? "choose a second place"}
        </p>
        {origin && target && compatiblePairs.length === 0 ? (
          <div>
            <p>Metroplist does not yet hold compatible evidence for these places.</p>
            {incompatibilityReasons.map((reason) => (
              <p key={reason}>{reason}</p>
            ))}
          </div>
        ) : null}
        {compatiblePairs.length > 0 ? (
          <label className="indicator-picker">
            Available indicator
            <select
              value={selectedObservationIds}
              onChange={(event) => setSelectedObservationIds(event.target.value)}
            >
              <option value="">Choose an indicator</option>
              {compatiblePairs.map((pair) => (
                <option
                  key={`${pair.origin.observationId}:${pair.target.observationId}`}
                  value={`${pair.origin.observationId}:${pair.target.observationId}`}
                >
                  {pair.origin.indicatorName} · {pair.origin.referenceYear} · {pair.origin.unit}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="comparison-actions">
          <button
            className="secondary-action"
            type="button"
            disabled={!origin || !target}
            onClick={() => {
              setOrigin(target);
              setTarget(origin);
              setOriginQuery(targetQuery);
              setTargetQuery(originQuery);
              setOriginEvidence(targetEvidence);
              setTargetEvidence(originEvidence);
              setSelectedObservationIds("");
              updateComparisonUrl(target, origin);
            }}
          >
            Swap places
          </button>
        {origin && target && selectedPair ? (
          <Link
            className="primary-link"
            href={`/compare/${origin.slug}/${target.slug}?originObservationId=${encodeURIComponent(selectedPair.origin.observationId)}&targetObservationId=${encodeURIComponent(selectedPair.target.observationId)}`}
          >
            Open comparison
          </Link>
        ) : null}
        </div>
        {selectedPair ? (
          <p className="comparison-disclosure">
            {selectedPair.origin.referenceYear} · {selectedPair.origin.unit} ·{" "}
            {selectedPair.origin.methodologyVersion ?? "declared source methodology"} ·{" "}
            {selectedPair.origin.qualityStatus}. Geography:{" "}
            {selectedPair.origin.geographyType} and {selectedPair.target.geographyType}.
            Source releases: {selectedPair.origin.sourceReleaseId ?? "not declared"} and{" "}
            {selectedPair.target.sourceReleaseId ?? "not declared"}.
          </p>
        ) : null}
      </section>
    </div>
  );
}
