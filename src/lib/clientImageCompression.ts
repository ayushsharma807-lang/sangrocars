const MAX_DIMENSION = 1600;
const LARGE_FILE_BYTES = 1_500_000;
const OUTPUT_TYPE = "image/jpeg";
const DEFAULT_QUALITY = 0.82;
const MIN_QUALITY = 0.58;
const TARGET_BYTES = 1_200_000;

const readImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not read ${file.name}`));
    };
    image.src = url;
  });

const canvasToBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not compress image."));
          return;
        }
        resolve(blob);
      },
      OUTPUT_TYPE,
      quality
    );
  });

const sanitizeBaseName = (name: string) => {
  const trimmed = name.replace(/\.[^.]+$/, "");
  const cleaned = trimmed.replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-");
  return cleaned || "car-photo";
};

const isHeicLike = (file: File) => {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return (
    type.includes("heic") ||
    type.includes("heif") ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
};

export const compressCarImage = async (file: File) => {
  if (!file.type.startsWith("image/")) return file;
  let image: HTMLImageElement;
  try {
    image = await readImage(file);
  } catch (error) {
    if (isHeicLike(file)) {
      console.warn("Skipping client-side compression for HEIC/HEIF image", {
        fileName: file.name,
        type: file.type,
      });
      return file;
    }
    throw error;
  }
  const largestSide = Math.max(image.naturalWidth, image.naturalHeight);
  const needsResize = largestSide > MAX_DIMENSION;
  const needsCompression = file.size > LARGE_FILE_BYTES;

  if (!needsResize && !needsCompression) {
    return file;
  }

  const scale = needsResize ? MAX_DIMENSION / largestSide : 1;
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    return file;
  }

  context.drawImage(image, 0, 0, width, height);

  let quality = DEFAULT_QUALITY;
  let blob = await canvasToBlob(canvas, quality);

  while (blob.size > TARGET_BYTES && quality > MIN_QUALITY) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, quality);
  }

  const fileName = `${sanitizeBaseName(file.name)}.jpg`;
  return new File([blob], fileName, {
    type: OUTPUT_TYPE,
    lastModified: Date.now(),
  });
};
