export type SnapshotImageVariant = "landscape" | "square" | "portrait" | "story";

export const snapshotImageDimensions: Record<
  SnapshotImageVariant,
  { width: number; height: number }
> = {
  landscape: { width: 1200, height: 630 },
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
};

export function snapshotPngFilename(
  snapshotSlug: string,
  variant: SnapshotImageVariant,
): string {
  return `metroplist-${snapshotSlug}-${variant}.png`;
}

export async function readSnapshotSvg(response: Response): Promise<Blob> {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!response.ok || !contentType.startsWith("image/svg+xml")) {
    throw new Error("Snapshot image is unavailable.");
  }
  const blob = await response.blob();
  if (!blob.size || !blob.type.toLowerCase().startsWith("image/svg+xml")) {
    throw new Error("Snapshot image is unavailable.");
  }
  return blob;
}

async function loadImage(svg: Blob): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(svg);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Snapshot image could not be rendered."));
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function rasterizeSnapshotSvg(
  svg: Blob,
  dimensions: { width: number; height: number },
): Promise<Blob> {
  const image = await loadImage(svg);
  const canvas = document.createElement("canvas");
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Snapshot image could not be rendered.");
  context.drawImage(image, 0, 0, dimensions.width, dimensions.height);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (png) => (png ? resolve(png) : reject(new Error("Snapshot image could not be rendered."))),
      "image/png",
    );
  });
}

export function downloadSnapshotPng(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}
