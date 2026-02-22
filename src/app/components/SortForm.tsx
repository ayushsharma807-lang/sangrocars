"use client";

import { useRef } from "react";

type Props = {
  sortValue: string;
  preservedParams: { key: string; value: string }[];
};

export default function SortForm({ sortValue, preservedParams }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleChange = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <form ref={formRef} className="sort-form" method="get">
      {preservedParams.map(({ key, value }) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <input type="hidden" name="page" value="1" />
      <label className="sort">
        <span>Sort by</span>
        <select name="sort" defaultValue={sortValue} onChange={handleChange}>
          <option value="recent">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="year_desc">Year: Newest</option>
          <option value="year_asc">Year: Oldest</option>
        </select>
      </label>
    </form>
  );
}
