"use client";
import { useMemo, useState } from "react";
import { normalizePhotoUrls } from "@/lib/photoUrls";

type Props = {
  photos: string[] | string | null | undefined;
  alt: string;
};

export default function ListingGallery({ photos, alt }: Props) {
  const safePhotos = useMemo(() => normalizePhotoUrls(photos), [photos]);
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
        <img
          src={current}
          alt={alt}
          className="gallery__hero"
          loading="eager"
          decoding="async"
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
              <img
                src={photo}
                alt={`${alt} ${index + 1}`}
                className="gallery__thumb-image"
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
