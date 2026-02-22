"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type Props = {
  photos: string[];
  alt: string;
};

const normalizePhotos = (photos: string[]) =>
  photos.map((photo) => photo.trim()).filter(Boolean);

export default function ListingGallery({ photos, alt }: Props) {
  const safePhotos = useMemo(() => normalizePhotos(photos), [photos]);
  const [active, setActive] = useState(0);

  if (safePhotos.length === 0) {
    return <div className="listing__placeholder gallery__placeholder" />;
  }

  const total = safePhotos.length;
  const safeActive = Math.min(active, total - 1);
  const current = safePhotos[safeActive];

  const goPrev = () => setActive((prev) => (prev - 1 + total) % total);
  const goNext = () => setActive((prev) => (prev + 1) % total);

  return (
    <div className="gallery">
      <div className="gallery__main">
        <Image
          src={current}
          alt={alt}
          fill
          sizes="(max-width: 980px) 100vw, 60vw"
          className="gallery__image"
        />
        {total > 1 && (
          <>
            <button
              className="gallery__nav prev"
              onClick={goPrev}
              type="button"
              aria-label="Previous photo"
            >
              Prev
            </button>
            <button
              className="gallery__nav next"
              onClick={goNext}
              type="button"
              aria-label="Next photo"
            >
              Next
            </button>
            <div className="gallery__counter">
              {safeActive + 1} / {total}
            </div>
          </>
        )}
      </div>
      {total > 1 && (
        <div className="gallery__thumbs">
          {safePhotos.map((photo, index) => (
            <button
              key={`${photo}-${index}`}
              className={`gallery__thumb ${
                index === safeActive ? "is-active" : ""
              }`}
              onClick={() => setActive(index)}
              type="button"
            >
              <Image
                src={photo}
                alt={`${alt} ${index + 1}`}
                width={160}
                height={70}
                className="gallery__thumb-image"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
