"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SortForm from "@/app/components/SortForm";
import { getPrimaryPhoto } from "@/lib/photoUrls";
import { PublicListing, PAGE_SIZE } from "@/lib/publicListings";
import {
  formatCityTitle,
  formatKm,
  formatLocationTitle,
  formatPriceCompact,
  isNewArrival,
  titleCase,
} from "@/lib/listingDisplay";

type Props = {
  initialListings: PublicListing[];
  totalCount: number;
  error: string | null;
  sortValue: string;
  preservedParamEntries: { key: string; value: string }[];
  currentQueryParams: Record<string, string | undefined>;
  compareIds: string[];
};

const publicDealerLabel = (code?: string | null) =>
  code ? `Dealer ID ${code}` : "Verified dealer";

const buildQueryString = (
  currentQueryParams: Record<string, string | undefined>,
  overrides: Record<string, string | null | undefined>
) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(currentQueryParams)) {
    if (value) params.set(key, value);
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) continue;
    if (value === null || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  }
  return params.toString();
};

const estimateEmi = (value: number | null) => {
  if (!value) return null;
  const monthly = Math.round(value * 0.019);
  return `EMI from ₹${monthly.toLocaleString("en-IN")}/mo`;
};

const isLuxuryListing = (price?: number | null) => (price ?? 0) >= 4_500_000;

export default function InfiniteListings({
  initialListings,
  totalCount,
  error,
  sortValue,
  preservedParamEntries,
  currentQueryParams,
  compareIds,
}: Props) {
  const [listings, setListings] = useState(initialListings);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialListings.length < totalCount);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setListings(initialListings);
    setHasMore(initialListings.length < totalCount);
    setLoading(false);
    setLoadingError(null);
  }, [initialListings, totalCount]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(currentQueryParams)) {
      if (value) params.set(key, value);
    }
    return params.toString();
  }, [currentQueryParams]);

  const fetchMore = useCallback(async () => {
    if (loading || !hasMore || error) return;

    setLoading(true);
    setLoadingError(null);

    try {
      const params = new URLSearchParams(queryString);
      params.set("offset", String(listings.length));
      params.set("limit", String(PAGE_SIZE));

      const response = await fetch(`/api/listings?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Could not load more cars right now.");
      }

      const data = (await response.json()) as {
        listings?: PublicListing[];
        hasMore?: boolean;
        error?: string;
      };

      if (data.error) {
        throw new Error(data.error);
      }

      const nextListings = data.listings ?? [];
      setListings((current) => {
        const seen = new Set(current.map((listing) => listing.id));
        const merged = [...current];
        for (const listing of nextListings) {
          if (!seen.has(listing.id)) merged.push(listing);
        }
        return merged;
      });
      setHasMore(Boolean(data.hasMore) && listings.length + nextListings.length < totalCount);
    } catch (fetchError) {
      setLoadingError(
        fetchError instanceof Error
          ? fetchError.message
          : "Could not load more cars right now."
      );
    } finally {
      setLoading(false);
    }
  }, [error, hasMore, listings.length, loading, queryString, totalCount]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || error) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void fetchMore();
        }
      },
      { rootMargin: "280px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [error, fetchMore, hasMore]);

  return (
    <>
      <div className="simple-results__header">
        <div>
          <h2>Search results</h2>
          <p>
            {error
              ? "Listings are unavailable right now. Check your Supabase connection."
              : `Showing ${listings.length} of ${totalCount} listings`}
          </p>
        </div>
        <SortForm sortValue={sortValue} preservedParams={preservedParamEntries} />
      </div>

      <div className="simple-listings cw-listings">
        {listings.length === 0 ? (
          <div className="simple-empty">
            No listings match these filters yet. Try a wider search.
          </div>
        ) : (
          listings.map((listing) => {
            const photo = getPrimaryPhoto(listing.photo_urls);
            const titleParts = [
              listing.year ?? undefined,
              titleCase(listing.make),
              titleCase(listing.model),
              titleCase(listing.variant),
            ].filter(Boolean);
            const isLuxury = isLuxuryListing(listing.price);
            const isCompared = compareIds.includes(listing.id);
            const nextCompareIds = isCompared
              ? compareIds.filter((id) => id !== listing.id)
              : [...compareIds, listing.id].slice(0, 3);
            const canAddToCompare = isCompared || compareIds.length < 3;
            const emi = estimateEmi(listing.price);
            const city = formatCityTitle(listing.location);
            const dealerName = listing.dealer_id
              ? publicDealerLabel(listing.dealer_code)
              : "Private seller";
            const dealerCount = listing.dealer_count ?? 0;
            const kmText = formatKm(listing.km);
            const isCertified = Boolean(listing.stock_id);
            const isFresh = isNewArrival(listing.created_at);
            const listingCode = listing.id.slice(0, 6).toUpperCase();
            const compareHref = isCompared
              ? `/listings?${buildQueryString(currentQueryParams, {
                  compare: nextCompareIds.length ? nextCompareIds.join(",") : null,
                })}`
              : nextCompareIds.length >= 2
                ? `/compare?ids=${nextCompareIds.join(",")}`
                : `/listings?${buildQueryString(currentQueryParams, {
                    compare: nextCompareIds.length ? nextCompareIds.join(",") : null,
                  })}`;
            const listingHref =
              compareIds.length > 0 && !isCompared
                ? compareHref
                : compareIds.length
                  ? `/listing/${listing.id}?compare=${compareIds.join(",")}`
                  : `/listing/${listing.id}`;
            const primaryActionLabel =
              compareIds.length > 0 && !isCompared
                ? "Compare with selected car"
                : "View details";

            return (
              <article className="simple-listing cw-listing" key={listing.id}>
                <div className="simple-listing__media cw-listing__media">
                  {photo ? (
                    <Image
                      src={photo}
                      alt={String(listing.model ?? "Car")}
                      fill
                      sizes="(max-width: 980px) 100vw, 320px"
                      className="simple-listing__image"
                    />
                  ) : (
                    <div className="simple-listing__placeholder" />
                  )}
                  <div className="simple-listing__tag-stack">
                    <span className="simple-listing__tag">Available</span>
                    <span
                      className="simple-listing__tag simple-listing__tag--id"
                      title={`Listing ID: ${listing.id}`}
                    >
                      ID {listingCode}
                    </span>
                    {isFresh && (
                      <span className="simple-listing__tag simple-listing__tag--new">
                        Just Added
                      </span>
                    )}
                    {isLuxury && (
                      <span className="simple-listing__tag simple-listing__tag--luxury">
                        Luxury
                      </span>
                    )}
                  </div>
                  <Link
                    href={listingHref}
                    className="cw-listing__image-link"
                    aria-label={`View ${titleParts.join(" ") || "car listing"}`}
                  />
                  {canAddToCompare ? (
                    <Link
                      className={`cw-save-btn${isCompared ? " cw-save-btn--active" : ""}`}
                      href={compareHref}
                      aria-label={isCompared ? "Remove saved car" : "Save this car"}
                      title={isCompared ? "Remove from saved" : "Save this car"}
                    >
                      ❤
                    </Link>
                  ) : (
                    <span
                      className="cw-save-btn cw-save-btn--disabled"
                      aria-label="Maximum 3 saved cars"
                      title="Maximum 3 saved cars"
                    >
                      ❤
                    </span>
                  )}
                </div>
                <div className="simple-listing__body cw-listing__body">
                  <h3>{titleParts.join(" ")}</h3>
                  <div className="cw-listing__price-row">
                    <strong className="cw-listing__price-line">
                      {formatPriceCompact(listing.price)}
                    </strong>
                    {isCertified && (
                      <span className="cw-certified-badge">Certified</span>
                    )}
                  </div>
                  <div className="cw-listing__facts">
                    <span>{kmText}</span>
                    <span>{formatLocationTitle(city) || "City on request"}</span>
                  </div>
                  {(listing.fuel || listing.transmission) && (
                    <p className="cw-listing__location">
                      {[titleCase(listing.fuel), titleCase(listing.transmission)]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                  )}
                  <div className="cw-listing__dealer">
                    <div className="cw-listing__dealer-head">
                      <span className="cw-dealer-logo cw-dealer-logo--fallback">
                        {listing.dealer_id ? "#" : "P"}
                      </span>
                      <div>
                        <span className="cw-dealer-name">{dealerName}</span>
                        <div className="cw-dealer-meta">
                          {listing.dealer_id
                            ? `Verified dealer · ${dealerCount} active cars`
                            : "Private seller"}
                        </div>
                      </div>
                    </div>
                    {listing.dealer_id && (
                      <div className="cw-dealer-row">
                        <span className="cw-dealer-response">
                          Usually responds in 10 mins
                        </span>
                      </div>
                    )}
                  </div>
                  {emi && <span className="cw-listing__emi">{emi}</span>}
                  <div className="cw-listing__finance">
                    <span>Finance available</span>
                    <span>Insurance assistance</span>
                  </div>
                  <div className="simple-listing__actions cw-listing__actions">
                    <Link
                      className="simple-button simple-button--full cw-listing__cta"
                      href={listingHref}
                    >
                      {primaryActionLabel === "View details"
                        ? "View Details →"
                        : primaryActionLabel}
                    </Link>
                    {canAddToCompare ? (
                      <Link className="simple-link-btn" href={compareHref}>
                        {isCompared ? "Remove compare" : "Add compare"}
                      </Link>
                    ) : (
                      <span className="simple-link-btn simple-link-btn--muted">
                        Max 3 cars
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}

        {!error && hasMore && (
          <div className="simple-infinite-status" ref={sentinelRef}>
            {loading ? (
              <div className="simple-spinner-wrap">
                <span className="simple-spinner" aria-hidden="true" />
                <span>Loading more cars...</span>
              </div>
            ) : (
              <span className="simple-infinite-hint">Scroll to load more cars</span>
            )}
          </div>
        )}

        {!error && !hasMore && listings.length > 0 && (
          <div className="simple-infinite-status simple-infinite-status--done">
            <span>You&apos;ve reached the end of the listings.</span>
          </div>
        )}

        {loadingError && (
          <div className="simple-infinite-status simple-infinite-status--error">
            <span>{loadingError}</span>
          </div>
        )}
      </div>
    </>
  );
}
