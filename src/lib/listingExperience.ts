type ListingExperienceInput = {
  tour360Url?: string | null;
  interiorVrUrl?: string | null;
  arModelUrl?: string | null;
  arIosModelUrl?: string | null;
  walkthroughVideoUrl?: string | null;
};

export type ListingExperienceMeta = {
  tour360Url: string | null;
  interiorVrUrl: string | null;
  arModelUrl: string | null;
  arIosModelUrl: string | null;
  walkthroughVideoUrl: string | null;
};

const MARKERS = {
  tour360Url: "[TOUR_360_URL]",
  interiorVrUrl: "[INTERIOR_VR_URL]",
  arModelUrl: "[AR_MODEL_URL]",
  arIosModelUrl: "[AR_IOS_MODEL_URL]",
  walkthroughVideoUrl: "[WALKTHROUGH_VIDEO_URL]",
} as const;

const cleanInline = (value?: string | null) =>
  value ? value.replace(/\s+/g, " ").trim() : "";

const toMeta = (input?: ListingExperienceInput | null): ListingExperienceMeta => ({
  tour360Url: cleanInline(input?.tour360Url) || null,
  interiorVrUrl: cleanInline(input?.interiorVrUrl) || null,
  arModelUrl: cleanInline(input?.arModelUrl) || null,
  arIosModelUrl: cleanInline(input?.arIosModelUrl) || null,
  walkthroughVideoUrl: cleanInline(input?.walkthroughVideoUrl) || null,
});

export const buildListingExperienceDescription = (
  input: ListingExperienceInput,
  userDescription?: string | null
) => {
  const meta = toMeta(input);
  const lines: string[] = [];
  const details = userDescription?.trim() ?? "";

  for (const [key, marker] of Object.entries(MARKERS) as [
    keyof ListingExperienceMeta,
    string,
  ][]) {
    const value = meta[key];
    if (value) lines.push(`${marker}: ${value}`);
  }

  if (lines.length > 0 && details) {
    lines.push("---");
  }
  if (details) {
    lines.push(details);
  }

  return lines.join("\n").trim() || null;
};

export const parseListingExperienceDescription = (description?: string | null) => {
  const empty = {
    meta: toMeta(null),
    cleanDescription: null as string | null,
  };

  if (!description) return empty;

  const lines = description
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  const meta = toMeta(null);
  const remaining: string[] = [];

  for (const line of lines) {
    if (line.startsWith(`${MARKERS.tour360Url}:`)) {
      meta.tour360Url = cleanInline(line.replace(`${MARKERS.tour360Url}:`, "")) || null;
      continue;
    }
    if (line.startsWith(`${MARKERS.interiorVrUrl}:`)) {
      meta.interiorVrUrl =
        cleanInline(line.replace(`${MARKERS.interiorVrUrl}:`, "")) || null;
      continue;
    }
    if (line.startsWith(`${MARKERS.arModelUrl}:`)) {
      meta.arModelUrl = cleanInline(line.replace(`${MARKERS.arModelUrl}:`, "")) || null;
      continue;
    }
    if (line.startsWith(`${MARKERS.arIosModelUrl}:`)) {
      meta.arIosModelUrl =
        cleanInline(line.replace(`${MARKERS.arIosModelUrl}:`, "")) || null;
      continue;
    }
    if (line.startsWith(`${MARKERS.walkthroughVideoUrl}:`)) {
      meta.walkthroughVideoUrl =
        cleanInline(line.replace(`${MARKERS.walkthroughVideoUrl}:`, "")) || null;
      continue;
    }
    if (line === "---") {
      continue;
    }
    remaining.push(line);
  }

  return {
    meta,
    cleanDescription: remaining.join("\n").trim() || null,
  };
};
