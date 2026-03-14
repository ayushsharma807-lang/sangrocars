"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  FUEL_OPTIONS,
  MAKE_OPTIONS,
  TRANSMISSION_OPTIONS,
  getModelOptions,
  getVariantOptions,
} from "@/lib/carOptions";
import ListingComboboxField from "@/app/admin/listings/ListingComboboxField";

type DealerOption = {
  id: string;
  name: string | null;
};

type ListingValues = {
  id: string;
  dealer_id: string | null;
  type: string | null;
  status: string | null;
  make: string | null;
  model: string | null;
  variant: string | null;
  year: number | null;
  price: number | null;
  km: number | null;
  fuel: string | null;
  transmission: string | null;
  location: string | null;
  description: string | null;
  photo_urls: string[] | null;
};

const joinPhotos = (photos?: string[] | null) => photos?.join("\n") ?? "";

export default function AdminEditListingForm({
  listing,
  dealers,
  isPending,
  cleanedDescription,
}: {
  listing: ListingValues;
  dealers: DealerOption[];
  isPending: boolean;
  cleanedDescription: string;
}) {
  const [make, setMake] = useState(listing.make ?? "");
  const [model, setModel] = useState(listing.model ?? "");
  const [variant, setVariant] = useState(listing.variant ?? "");

  const modelOptions = useMemo(() => getModelOptions(make), [make]);
  const variantOptions = useMemo(() => getVariantOptions(model), [model]);


  return (
    <form className="dealer-form admin-car-form" method="post" action={`/api/admin/listings/${listing.id}`}>
      <div className="dealer-form__grid">
        <label>
          Dealer account
          <select name="dealer_id" defaultValue={listing.dealer_id ?? "none"}>
            <option value="none">No dealer (private seller / ad-hoc)</option>
            {dealers.map((dealer) => (
              <option key={dealer.id} value={dealer.id}>
                {dealer.name || dealer.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Type
          <select name="type" defaultValue={listing.type ?? "used"}>
            <option value="used">Used</option>
            <option value="new">New</option>
          </select>
        </label>
        <label>
          Status
          <select
            name="status"
            defaultValue={isPending ? "pending" : listing.status ?? "available"}
          >
            <option value="pending">Pending approval</option>
            <option value="available">Available</option>
            <option value="sold">Sold</option>
          </select>
        </label>
        <ListingComboboxField
          label="Make *"
          name="make"
          value={make}
          onChange={(value) => setMake(value)}
          options={MAKE_OPTIONS}
          placeholder="Type or search make"
          required
        />
        <ListingComboboxField
          label="Model *"
          name="model"
          value={model}
          onChange={(value) => setModel(value)}
          options={modelOptions}
          placeholder={make ? "Type or search model" : "Type model or select make first"}
          required
        />
        <ListingComboboxField
          label="Variant"
          name="variant"
          value={variant}
          onChange={(value) => setVariant(value)}
          options={variantOptions}
          placeholder={model ? "Type or search variant" : "Type variant or select model first"}
        />
        <label>
          Year
          <input name="year" type="number" defaultValue={listing.year ?? ""} />
        </label>
        <label>
          Selling price
          <input name="price" type="number" defaultValue={listing.price ?? ""} />
        </label>
        <label>
          KM driven
          <input name="km" type="number" defaultValue={listing.km ?? ""} />
        </label>
        <label>
          Fuel
          <select name="fuel" defaultValue={listing.fuel ?? ""}>
            <option value="">Select fuel</option>
            {FUEL_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Transmission
          <select name="transmission" defaultValue={listing.transmission ?? ""}>
            <option value="">Select transmission</option>
            {TRANSMISSION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Location
          <input name="location" defaultValue={listing.location ?? ""} />
        </label>
      </div>
      <label>
        Description
        <textarea name="description" rows={5} defaultValue={cleanedDescription} />
      </label>
      <label>
        Photo URLs (one per line)
        <textarea name="photo_urls" rows={5} defaultValue={joinPhotos(listing.photo_urls)} />
      </label>
      <div className="dealer-form__actions">
        <button className="btn btn--solid" type="submit">
          Save changes
        </button>
        <Link className="btn btn--ghost" href="/admin/listings">
          Cancel
        </Link>
      </div>
    </form>
  );
}
