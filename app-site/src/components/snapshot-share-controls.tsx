"use client";

import { useState } from "react";
import {
  emailShareUrl,
  facebookShareUrl,
  linkedInShareUrl,
  xShareUrl,
} from "@/modules/publications";

export function SnapshotShareControls({
  snapshotSlug,
  title,
  summary,
  canonicalUrl,
}: {
  snapshotSlug: string;
  title: string;
  summary: string;
  canonicalUrl: string;
}) {
  const [message, setMessage] = useState("");
  const details = { title, summary, url: canonicalUrl };

  async function nativeShare() {
    if (!navigator.share) {
      setMessage("Native sharing is not available here. Use a link or download instead.");
      return;
    }
    try {
      await navigator.share({ title, text: summary, url: canonicalUrl });
      setMessage("Share sheet opened.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage("The device share sheet could not be opened.");
    }
  }

  async function shareImage() {
    if (!navigator.share || !navigator.canShare) {
      setMessage("Image sharing is unavailable here. Download the image instead.");
      return;
    }
    try {
      const response = await fetch(`/snapshot/${snapshotSlug}/image/square`);
      if (!response.ok) throw new Error("Image unavailable");
      const file = new File(
        [await response.blob()],
        `metroplist-${snapshotSlug}.png`,
        { type: "image/png" },
      );
      if (!navigator.canShare({ files: [file] })) {
        setMessage("This device cannot share the image file. Download it instead.");
        return;
      }
      await navigator.share({ title, text: summary, url: canonicalUrl, files: [file] });
      setMessage("Image share sheet opened.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage("The image could not be shared from this browser.");
    }
  }

  async function copy(value: string, success: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(success);
    } catch {
      setMessage("Copying is unavailable. Select the text from the Snapshot page.");
    }
  }

  return (
    <section className="snapshot-share" aria-labelledby="share-snapshot">
      <h2 id="share-snapshot">Share and export</h2>
      <div className="share-actions">
        <button type="button" onClick={nativeShare}>Share</button>
        <button type="button" onClick={shareImage}>Share image</button>
        <button type="button" onClick={() => copy(canonicalUrl, "Snapshot link copied.")}>Copy link</button>
        <button type="button" onClick={() => copy(summary, "Summary copied.")}>Copy summary</button>
        <button type="button" onClick={() => copy(`${summary}\n${canonicalUrl}`, "Caption copied.")}>Copy caption</button>
        <a href={emailShareUrl(details)}>Email</a>
        <a href={xShareUrl(details)} target="_blank" rel="noreferrer">X</a>
        <a href={linkedInShareUrl(details)} target="_blank" rel="noreferrer">LinkedIn</a>
        <a href={facebookShareUrl(details)} target="_blank" rel="noreferrer">Facebook</a>
      </div>
      <div className="share-actions secondary">
        <a download href={`/snapshot/${snapshotSlug}/image/square`}>Download square image</a>
        <a download href={`/snapshot/${snapshotSlug}/image/portrait`}>Download portrait image</a>
        <a download href={`/snapshot/${snapshotSlug}/image/story`}>Download story image</a>
        <a download href={`/api/snapshots/${snapshotSlug}/csv`}>Download CSV</a>
        <a download href={`/api/snapshots/${snapshotSlug}/json`}>Download JSON</a>
      </div>
      <p className="share-note">
        For Instagram, use your device share sheet where available, or download an image and copy the summary and link.
      </p>
      <p role="status">{message}</p>
    </section>
  );
}
