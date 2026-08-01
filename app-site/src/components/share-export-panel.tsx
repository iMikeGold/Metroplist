"use client";

import { useEffect, useRef, useState } from "react";

interface EvidenceChoice {
  observationId: string;
  label: string;
  detail: string;
}

export function ShareExportPanel({
  snapshotType,
  placeIds,
  evidence,
  initialOpen = false,
}: {
  snapshotType: "place_profile" | "comparison";
  placeIds: string[];
  evidence: EvidenceChoice[];
  initialOpen?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState(() =>
    evidence.map((choice) => choice.observationId),
  );
  const [contentMode, setContentMode] = useState(
    snapshotType === "comparison" ? "full_comparison" : "place_summary",
  );
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!initialOpen) return;
    const timer = window.setTimeout(() => dialog.current?.showModal(), 0);
    return () => window.clearTimeout(timer);
  }, [initialOpen]);

  async function publish() {
    setMessage("Creating Snapshot…");
    const response = await fetch("/api/snapshots", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        snapshotType,
        placeIds,
        observationIds: selected,
        contentMode,
        preferredVariant: "landscape",
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(payload.error ?? "Snapshot creation is unavailable.");
      return;
    }
    window.location.assign(`/snapshot/${payload.snapshotSlug}`);
  }

  return (
    <div className="share-export-entry">
      <button
        className="primary-link"
        type="button"
        onClick={() => dialog.current?.showModal()}
      >
        Share or export
      </button>
      <dialog
        ref={dialog}
        className="share-dialog"
        aria-labelledby="share-dialog-title"
        onClose={() => setMessage("")}
      >
        <div className="share-dialog-heading">
          <div>
            <p className="eyebrow">Metroplist Snapshot</p>
            <h2 id="share-dialog-title">Share this result</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Close share panel"
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
        </div>
        <fieldset>
          <legend>Choose content</legend>
          {(snapshotType === "comparison"
            ? [
                ["key_finding", "Key finding"],
                ["full_comparison", "Full comparison"],
                ["data_table", "Data table"],
                ["map_and_figures", "Map and figures"],
              ]
            : [
                ["place_summary", "Place summary"],
                ["selected_indicators", "Selected indicators"],
                ["data_table", "Data table"],
                ["map_and_figures", "Map and figures"],
              ]
          ).map(([value, label]) => (
            <label key={value} className="choice-row">
              <input
                type="radio"
                name="content-mode"
                value={value}
                checked={contentMode === value}
                onChange={() => setContentMode(value)}
              />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Measurements</legend>
          {evidence.map((choice) => (
            <label key={choice.observationId} className="choice-row">
              <input
                type="checkbox"
                checked={selected.includes(choice.observationId)}
                onChange={(event) =>
                  setSelected((current) =>
                    event.target.checked
                      ? [...current, choice.observationId]
                      : current.filter((id) => id !== choice.observationId),
                  )
                }
              />
              <span><strong>{choice.label}</strong><small>{choice.detail}</small></span>
            </label>
          ))}
        </fieldset>
        <div className="snapshot-preview" aria-live="polite">
          <strong>Preview</strong>
          <p>{selected.length} measurement{selected.length === 1 ? "" : "s"} selected.</p>
        </div>
        {message ? <p role="status">{message}</p> : null}
        <div className="dialog-actions">
          <button type="button" className="secondary-action" onClick={() => dialog.current?.close()}>
            Cancel
          </button>
          <button type="button" disabled={!selected.length} onClick={publish}>
            Create Snapshot
          </button>
        </div>
      </dialog>
    </div>
  );
}
