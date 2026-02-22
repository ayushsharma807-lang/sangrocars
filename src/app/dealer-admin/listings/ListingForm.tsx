type ListingFormData = {
  id?: string;
  type?: string | null;
  make?: string | null;
  model?: string | null;
  variant?: string | null;
  year?: number | null;
  km?: number | null;
  fuel?: string | null;
  transmission?: string | null;
  price?: number | null;
  location?: string | null;
  description?: string | null;
  status?: string | null;
  photo_urls?: string[] | null;
  tour_360_url?: string | null;
  walkthrough_video_url?: string | null;
  interior_vr_url?: string | null;
  ar_model_url?: string | null;
  ar_ios_model_url?: string | null;
};

type Props = {
  listing?: ListingFormData | null;
  action: string;
  submitLabel: string;
};

const joinPhotos = (photos?: string[] | null) =>
  photos?.join("\n") ?? "";

export default function ListingForm({ listing, action, submitLabel }: Props) {
  return (
    <form
      className="dealer-form"
      method="post"
      action={action}
      encType="multipart/form-data"
    >
      <div className="dealer-form__grid">
        <label>
          Type
          <select name="type" defaultValue={listing?.type ?? "used"}>
            <option value="used">Used</option>
            <option value="new">New</option>
          </select>
        </label>
        <label>
          Status
          <select name="status" defaultValue={listing?.status ?? "available"}>
            <option value="available">Available</option>
            <option value="sold">Sold</option>
          </select>
        </label>
        <label>
          Make
          <input name="make" defaultValue={listing?.make ?? ""} required />
        </label>
        <label>
          Model
          <input name="model" defaultValue={listing?.model ?? ""} required />
        </label>
        <label>
          Variant
          <input name="variant" defaultValue={listing?.variant ?? ""} />
        </label>
        <label>
          Year
          <input name="year" type="number" defaultValue={listing?.year ?? ""} />
        </label>
        <label>
          Price
          <input
            name="price"
            type="number"
            defaultValue={listing?.price ?? ""}
          />
        </label>
        <label>
          Kilometers
          <input name="km" type="number" defaultValue={listing?.km ?? ""} />
        </label>
        <label>
          Fuel
          <input name="fuel" defaultValue={listing?.fuel ?? ""} />
        </label>
        <label>
          Transmission
          <input name="transmission" defaultValue={listing?.transmission ?? ""} />
        </label>
        <label>
          Location
          <input name="location" defaultValue={listing?.location ?? ""} />
        </label>
      </div>
      <label>
        Description
        <textarea
          name="description"
          rows={4}
          defaultValue={listing?.description ?? ""}
        />
      </label>
      <label>
        Photo URLs (one per line)
        <textarea
          name="photo_urls"
          rows={4}
          defaultValue={joinPhotos(listing?.photo_urls)}
        />
      </label>
      <div className="dealer-form__grid">
        <label>
          360 tour URL
          <input
            name="tour_360_url"
            defaultValue={listing?.tour_360_url ?? ""}
            placeholder="YouTube / Meta 360 link"
          />
        </label>
        <label>
          Walkthrough video URL
          <input
            name="walkthrough_video_url"
            defaultValue={listing?.walkthrough_video_url ?? ""}
            placeholder="YouTube / MP4 / Instagram embed link"
          />
        </label>
        <label>
          Interior VR URL
          <input
            name="interior_vr_url"
            defaultValue={listing?.interior_vr_url ?? ""}
            placeholder="VR headset compatible tour link"
          />
        </label>
        <label>
          AR model (.glb)
          <input
            name="ar_model_url"
            defaultValue={listing?.ar_model_url ?? ""}
            placeholder="https://.../model.glb"
          />
        </label>
        <label>
          AR iOS model (.usdz)
          <input
            name="ar_ios_model_url"
            defaultValue={listing?.ar_ios_model_url ?? ""}
            placeholder="https://.../model.usdz"
          />
        </label>
      </div>
      <label>
        Upload photos from phone/laptop
        <input
          type="file"
          name="photo_files"
          accept="image/*"
          capture="environment"
          multiple
        />
        <span className="dealer-form__hint">
          On mobile this opens gallery/camera directly.
        </span>
      </label>
      <button className="btn btn--solid" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
