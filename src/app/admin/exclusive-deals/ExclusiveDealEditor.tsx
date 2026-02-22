"use client";

import { useMemo, useState } from "react";
import SocialEmbed from "@/app/components/SocialEmbed";

type InitialValues = {
  title?: string;
  dealer?: string;
  city?: string;
  price?: string;
  video_url?: string;
  embed_code?: string;
  tags?: string;
  highlights?: string;
  sort_order?: number;
  is_active?: boolean;
};

type Props = {
  action: string;
  submitLabel: string;
  initial?: InitialValues;
  layout?: "stack" | "side";
  showPreview?: boolean;
};

const normalizeVideoUrl = (value?: string | null) => {
  if (!value) return "";
  const url = value.trim();
  if (!url) return "";
  if (url.includes("/embed/")) return url;
  if (url.includes("youtube.com/watch")) {
    try {
      const parsed = new URL(url);
      const id = parsed.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    } catch {
      return url;
    }
  }
  if (url.includes("youtu.be/")) {
    const parts = url.split("youtu.be/");
    const id = parts[1]?.split("?")[0];
    if (id) return `https://www.youtube.com/embed/${id}`;
  }
  return url;
};

export default function ExclusiveDealEditor({
  action,
  submitLabel,
  initial,
  layout = "stack",
  showPreview = true,
}: Props) {
  const [videoUrl, setVideoUrl] = useState(initial?.video_url ?? "");
  const [embedCode, setEmbedCode] = useState(initial?.embed_code ?? "");

  const normalizedVideo = useMemo(
    () => normalizeVideoUrl(videoUrl),
    [videoUrl]
  );
  const hasEmbed = embedCode.trim().length > 0;

  return (
    <div
      className={`exclusive-admin__editor ${
        layout === "side" ? "exclusive-admin__editor--side" : ""
      }`}
    >
      <div className="exclusive-admin__preview">
        {showPreview ? (
          hasEmbed ? (
            <SocialEmbed embedCode={embedCode} />
          ) : normalizedVideo ? (
            normalizedVideo.endsWith(".mp4") ? (
              <video controls src={normalizedVideo} />
            ) : (
              <iframe
                src={normalizedVideo}
                title={initial?.title ?? "Deal video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )
          ) : (
            <div className="video-frame__placeholder">No video</div>
          )
        ) : (
          <div className="video-frame__placeholder">Preview off</div>
        )}
      </div>
      <form className="admin-form admin-form--wide" method="post" action={action}>
        <label>
          Deal title
          <input
            name="title"
            placeholder="2022 Hyundai Creta SX"
            defaultValue={initial?.title ?? ""}
            required
          />
        </label>
        <label>
          Dealer name
          <input
            name="dealer"
            placeholder="Jalandhar Cars"
            defaultValue={initial?.dealer ?? ""}
            required
          />
        </label>
        <label>
          City
          <input
            name="city"
            placeholder="Jalandhar, Punjab"
            defaultValue={initial?.city ?? ""}
          />
        </label>
        <label>
          Price label
          <input
            name="price"
            placeholder="₹12.9L"
            defaultValue={initial?.price ?? ""}
          />
        </label>
        <label>
          Video URL (YouTube/Vimeo)
          <input
            name="video_url"
            placeholder="https://www.youtube.com/watch?v=..."
            defaultValue={initial?.video_url ?? ""}
            onInput={(event) =>
              setVideoUrl((event.target as HTMLInputElement).value)
            }
          />
        </label>
        <label>
          Embed code (Instagram/Facebook)
          <textarea
            name="embed_code"
            rows={3}
            placeholder="Paste the full embed code here"
            defaultValue={initial?.embed_code ?? ""}
            onInput={(event) =>
              setEmbedCode((event.target as HTMLTextAreaElement).value)
            }
          />
          <span className="dealer-form__hint">
            Use embed code from Instagram/Facebook if you want those videos.
          </span>
        </label>
        <label>
          Tags (comma separated)
          <input
            name="tags"
            placeholder="Single owner, Certified"
            defaultValue={initial?.tags ?? ""}
          />
        </label>
        <label>
          Highlights (one per line)
          <textarea
            name="highlights"
            rows={3}
            defaultValue={initial?.highlights ?? ""}
          />
        </label>
        <label>
          Sort order
          <input
            name="sort_order"
            type="number"
            defaultValue={Number(initial?.sort_order ?? 0)}
          />
        </label>
        <label className="admin-form__checkbox">
          <input
            name="is_active"
            type="checkbox"
            defaultChecked={initial?.is_active ?? true}
          />
          Show on homepage
        </label>
        <button className="btn btn--solid" type="submit">
          {submitLabel}
        </button>
      </form>
    </div>
  );
}
