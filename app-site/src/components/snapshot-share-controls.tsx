"use client";

import { useEffect, useState } from "react";
import {
  emailShareUrl,
  facebookShareUrl,
  linkedInShareUrl,
  xShareUrl,
} from "@/modules/publications";
import {
  downloadSnapshotPng,
  rasterizeSnapshotSvg,
  readSnapshotSvg,
  snapshotImageDimensions,
  snapshotPngFilename,
  type SnapshotImageVariant,
} from "@/modules/publications/client-image";

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
  const [isIos, setIsIos] = useState(false);
  const details = { title, summary, url: canonicalUrl };

  useEffect(() => {
    setIsIos(/iPad|iPhone|iPod/.test(navigator.userAgent));
  }, []);

  async function createPng(variant: SnapshotImageVariant): Promise<Blob> {
    const response = await fetch(`/snapshot/${snapshotSlug}/image/${variant}`);
    const svg = await readSnapshotSvg(response);
    return rasterizeSnapshotSvg(svg, snapshotImageDimensions[variant]);
  }

  async function downloadImage(variant: SnapshotImageVariant) {
    try {
      const png = await createPng(variant);
      downloadSnapshotPng(png, snapshotPngFilename(snapshotSlug, variant));
      setMessage("PNG image downloaded.");
    } catch {
      setMessage("The image could not be generated. Please try again.");
    }
  }

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
    try {
      const png = await createPng("square");
      const file = new File(
        [png],
        snapshotPngFilename(snapshotSlug, "square"),
        { type: "image/png" },
      );
      if (!navigator.share || !navigator.canShare || !navigator.canShare({ files: [file] })) {
        downloadSnapshotPng(png, file.name);
        setMessage("This device cannot share image files. The PNG was downloaded instead.");
        return;
      }
      await navigator.share({ title, text: summary, url: canonicalUrl, files: [file] });
      setMessage("Image share sheet opened.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage("The image could not be generated. Please try again.");
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
        <a href={linkedInShareUrl(details)} target="_blank" rel="noreferrer">LinkedIn — web</a>
        {isIos ? (
          <button type="button" disabled title="Use Share to choose Facebook on this device.">
            Facebook — use Share
          </button>
        ) : (
          <a href={facebookShareUrl(details)} target="_blank" rel="noreferrer">Facebook</a>
        )}
      </div>
      <div className="share-actions secondary">
        <button type="button" onClick={() => void downloadImage("square")}>Download square image</button>
        <button type="button" onClick={() => void downloadImage("portrait")}>Download portrait image</button>
        <button type="button" onClick={() => void downloadImage("story")}>Download story image</button>
        <a download href={`/api/snapshots/${snapshotSlug}/csv`}>Download CSV</a>
        <a download href={`/api/snapshots/${snapshotSlug}/json`}>Download JSON</a>
      </div>
      <p className="share-note">
        Instagram: Tap Share image and choose Instagram. If Instagram is unavailable, download the image and copy the caption.
      </p>
      <p role="status">{message}</p>
    </section>
  );
}
