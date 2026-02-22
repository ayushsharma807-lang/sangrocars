"use client";

import { useState } from "react";
import ExclusiveDealEditor from "./ExclusiveDealEditor";
import useHydrated from "@/app/components/useHydrated";

type DealItem = {
  id: string;
  title: string;
  dealer: string;
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
  deals: DealItem[];
};

const STORAGE_KEY = "carhub_show_deal_previews";

function ExclusiveDealsManagerInner({ deals }: Props) {
  const [showPreview, setShowPreview] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved !== null) return saved === "true";
    } catch {
      // ignore
    }
    return false;
  });

  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.checked;
    setShowPreview(nextValue);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(nextValue));
    } catch {
      // ignore
    }
  };

  return (
    <>
      <div className="exclusive-admin__toggle">
        <label>
          <input
            type="checkbox"
            checked={showPreview}
            onChange={handleToggle}
          />
          Show previews (slower)
        </label>
      </div>

      <div className="exclusive-admin__create">
        <h3>Add a weekly deal</h3>
        <ExclusiveDealEditor
          action="/api/admin/exclusive-deals"
          submitLabel="Add deal"
          layout="stack"
          showPreview={showPreview}
        />
      </div>

      <div className="exclusive-admin__list">
        {deals.length === 0 ? (
          <div className="empty">No exclusive deals yet.</div>
        ) : (
          deals.map((deal) => (
            <article className="exclusive-admin__card" key={deal.id}>
              <ExclusiveDealEditor
                action={`/api/admin/exclusive-deals/${deal.id}`}
                submitLabel="Save changes"
                layout="side"
                showPreview={showPreview}
                initial={deal}
              />
              <form
                className="exclusive-admin__delete"
                method="post"
                action={`/api/admin/exclusive-deals/${deal.id}/delete`}
              >
                <button className="btn btn--ghost" type="submit">
                  Delete deal
                </button>
              </form>
            </article>
          ))
        )}
      </div>
    </>
  );
}

export default function ExclusiveDealsManager({ deals }: Props) {
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <div className="exclusive-admin__toggle">
        <label>
          <input type="checkbox" checked={false} readOnly />
          Show previews (slower)
        </label>
      </div>
    );
  }

  return <ExclusiveDealsManagerInner deals={deals} />;
}
