'use client';

import { useEffect, useMemo, useState } from 'react';
import { hasSupabaseBrowserConfig, supabaseBrowser } from '@/lib/supabase-browser';

export default function AddListingPage() {
  const [form, setForm] = useState({
    seller_type: 'dealer',
    seller_name: '',
    seller_phone: '',
    make: '',
    model: '',
    variant: '',
    year: '',
    fuel: '',
    transmission: '',
    km_driven: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const previews = useMemo(
    () => photos.map((file) => URL.createObjectURL(file)),
    [photos]
  );

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSaveDraft() {
    setLoading(true);
    setMessage('');

    if (!hasSupabaseBrowserConfig()) {
      setMessage('Supabase is not configured for this deployment.');
      setLoading(false);
      return;
    }

    if (!form.make.trim() || !form.model.trim()) {
      setMessage('Make and model are required.');
      setLoading(false);
      return;
    }

    const supabase = supabaseBrowser();
    const { data, error } = await supabase
      .from('car_listings')
      .insert({
      seller_type: form.seller_type,
      seller_name: form.seller_name || null,
      seller_phone: form.seller_phone || null,
      make: form.make,
      model: form.model,
      variant: form.variant || null,
      year: form.year ? Number(form.year) : null,
      fuel: form.fuel || null,
      transmission: form.transmission || null,
      km_driven: form.km_driven ? Number(form.km_driven) : null,
      status: 'draft',
    })
      .select('id')
      .single();

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const listingId = data?.id;
    if (listingId && photos.length > 0) {
      const uploads = await Promise.all(
        photos.map(async (file) => {
          const path = `${listingId}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('listing-photos')
            .upload(path, file, { upsert: true });

          if (uploadError) return null;

          const { data: publicUrl } = supabase.storage
            .from('listing-photos')
            .getPublicUrl(path);

          return publicUrl.publicUrl;
        })
      );

      const photoRows = uploads
        .filter(Boolean)
        .map((url) => ({
          listing_id: listingId,
          photo_url: url as string,
        }));

      if (photoRows.length > 0) {
        await supabase.from('listing_photos').insert(photoRows);
      }
    }

    setMessage('Draft saved successfully.');
    setForm({
      seller_type: 'dealer',
      seller_name: '',
      seller_phone: '',
      make: '',
      model: '',
      variant: '',
      year: '',
      fuel: '',
      transmission: '',
      km_driven: '',
    });
    setPhotos([]);

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-white px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold text-black">Add Car</h1>
        <p className="mt-1 text-sm text-gray-600">
          Fill basic details and save as draft
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveDraft();
          }}
          className="mt-6 space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-black">
              Seller Type
            </label>
            <select
              name="seller_type"
              value={form.seller_type}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-3 py-3 text-black outline-none"
            >
              <option value="dealer">Dealer</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-black">
              Seller Name
            </label>
            <input
              name="seller_name"
              value={form.seller_name}
              onChange={handleChange}
              placeholder="Enter seller name"
              className="w-full rounded-xl border border-gray-300 px-3 py-3 text-black outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-black">
              Seller Phone
            </label>
            <input
              name="seller_phone"
              value={form.seller_phone}
              onChange={handleChange}
              placeholder="Enter seller phone"
              className="w-full rounded-xl border border-gray-300 px-3 py-3 text-black outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-black">
              Make
            </label>
            <input
              name="make"
              value={form.make}
              onChange={handleChange}
              placeholder="e.g. Maruti"
              className="w-full rounded-xl border border-gray-300 px-3 py-3 text-black outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-black">
              Model
            </label>
            <input
              name="model"
              value={form.model}
              onChange={handleChange}
              placeholder="e.g. Swift"
              className="w-full rounded-xl border border-gray-300 px-3 py-3 text-black outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-black">
              Variant
            </label>
            <input
              name="variant"
              value={form.variant}
              onChange={handleChange}
              placeholder="e.g. VXI"
              className="w-full rounded-xl border border-gray-300 px-3 py-3 text-black outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-black">
              Year
            </label>
            <input
              name="year"
              type="number"
              value={form.year}
              onChange={handleChange}
              placeholder="e.g. 2021"
              className="w-full rounded-xl border border-gray-300 px-3 py-3 text-black outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-black">
              Fuel
            </label>
            <input
              name="fuel"
              value={form.fuel}
              onChange={handleChange}
              placeholder="e.g. Petrol"
              className="w-full rounded-xl border border-gray-300 px-3 py-3 text-black outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-black">
              Transmission
            </label>
            <input
              name="transmission"
              value={form.transmission}
              onChange={handleChange}
              placeholder="e.g. Manual"
              className="w-full rounded-xl border border-gray-300 px-3 py-3 text-black outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-black">
              KM Driven
            </label>
            <input
              name="km_driven"
              type="number"
              value={form.km_driven}
              onChange={handleChange}
              placeholder="e.g. 45000"
              className="w-full rounded-xl border border-gray-300 px-3 py-3 text-black outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-black">
              Upload Photos
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setPhotos(files);
              }}
              className="w-full rounded-xl border border-gray-300 px-3 py-3 text-black outline-none"
            />
            {previews.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {previews.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`preview-${i}`}
                    className="h-20 w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          {message ? <p className="text-sm text-black">{message}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Save Draft'}
          </button>
        </form>
      </div>
    </div>
  );
}
