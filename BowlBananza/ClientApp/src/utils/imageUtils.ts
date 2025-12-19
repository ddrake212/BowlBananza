type CompressOptions = {
  maxBytes?: number;          // default 2MB
  maxDimension?: number;      // default 1600px (keeps avatars plenty sharp)
  outputType?: "image/webp" | "image/jpeg"; // default webp
  initialQuality?: number;    // default 0.85
  minQuality?: number;        // default 0.5
  qualityStep?: number;       // default 0.05
  forceReencode?: boolean;    // if false and already under maxBytes, returns original
};

function blobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, { type: blob.type, lastModified: Date.now() });
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Canvas toBlob returned null"));
        else resolve(blob);
      },
      type,
      quality
    );
  });
}

function drawResizedToCanvas(
  img: HTMLImageElement,
  maxDimension: number
): HTMLCanvasElement {
  const { width, height } = img;

  let targetW = width;
  let targetH = height;

  const largest = Math.max(width, height);
  if (largest > maxDimension) {
    const scale = maxDimension / largest;
    targetW = Math.round(width * scale);
    targetH = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context");

  // High-quality downscaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, targetW, targetH);

  return canvas;
}

function pickOutputName(originalName: string, mime: string): string {
  const base = originalName.replace(/\.[^.]+$/, "");
  const ext = mime === "image/webp" ? "webp" : "jpg";
  return `${base}.${ext}`;
}

/**
 * Compresses an image file to be under maxBytes (default 2MB).
 * Returns a new File suitable for upload.
 */
export async function compressImageUnder2MB(
  file: File,
  opts: CompressOptions = {}
): Promise<File> {
  const {
    maxBytes = 2 * 1024 * 1024,
    maxDimension = 1600,
    outputType = "image/webp",
    initialQuality = 0.85,
    minQuality = 0.5,
    qualityStep = 0.05,
    forceReencode = true,
  } = opts;

  // If it's already under budget and caller doesn't want re-encode, return as-is.
  if (!forceReencode && file.size <= maxBytes) return file;

  // Only attempt compression for image inputs
  if (!file.type.startsWith("image/")) {
    throw new Error(`Not an image file: ${file.type}`);
  }

  const img = await loadImageFromFile(file);
  const canvas = drawResizedToCanvas(img, maxDimension);

  // Try preferred type first; if browser can't encode it, we'll fall back.
  const typesToTry = outputType === "image/webp"
    ? ["image/webp", "image/jpeg"]
    : ["image/jpeg", "image/webp"];

  let bestBlob: Blob | null = null;

  for (const type of typesToTry) {
    let quality = initialQuality;

    // Iterate quality down until within size or we hit minQuality
    while (quality >= minQuality) {
      let blob: Blob;
      try {
        blob = await canvasToBlob(canvas, type, quality);
      } catch {
        // This type probably isn't supported by the browser; break and try next.
        blob = null as any;
      }

      if (!blob) break;

      // Track best attempt (smallest)
      if (!bestBlob || blob.size < bestBlob.size) bestBlob = blob;

      if (blob.size <= maxBytes) {
        const outName = pickOutputName(file.name, type);
        return blobToFile(blob, outName);
      }

      quality = Math.round((quality - qualityStep) * 100) / 100;
    }
  }

  // If we couldn't get under maxBytes, return the smallest attempt we found.
  if (bestBlob) {
    const outName = pickOutputName(file.name, bestBlob.type || file.type);
    return blobToFile(bestBlob, outName);
  }

  throw new Error("Unable to compress image in this browser");
}
