'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

type CarListing = {
  id: string;
  make: string | null;
  model: string | null;
  variant: string | null;
  year: number | null;
  status: string | null;
  photo_url?: string | null;
};

export default function WorkflowPage() {
  const [cars, setCars] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function fetchCars() {
    setLoading(true);

    const { data, error } = await supabase
      .from('car_listings')
      .select('id, make, model, variant, year, status')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const ids = data.map((car) => car.id);
      let photoMap: Record<string, string> = {};

      if (ids.length > 0) {
        const { data: photos } = await supabase
          .from('listing_photos')
          .select('listing_id, photo_url')
          .in('listing_id', ids)
          .order('created_at', { ascending: true });

        if (photos) {
          for (const photo of photos) {
            if (!photoMap[photo.listing_id]) {
              photoMap[photo.listing_id] = photo.photo_url;
            }
          }
        }
      }

      setCars(
        data.map((car) => ({
          ...car,
          photo_url: photoMap[car.id] || null,
        }))
      );
    }

    setLoading(false);
  }

  async function updateStatus(id: string, status: 'draft' | 'ready' | 'sold') {
    setUpdatingId(id);

    const { error } = await supabase
      .from('car_listings')
      .update({ status })
      .eq('id', id);

    if (!error) {
      setCars((prev) =>
        prev.map((car) => (car.id === id ? { ...car, status } : car))
      );
    }

    setUpdatingId(null);
  }

  useEffect(() => {
    fetchCars();
  }, []);

  return (
    <div className="min-h-screen bg-white px-4 py-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold text-black">Workflow Listings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Simple internal listing workflow
        </p>

        {loading ? (
          <p className="mt-6 text-sm text-gray-600">Loading...</p>
        ) : cars.length === 0 ? (
          <p className="mt-6 text-sm text-gray-600">No listings found.</p>
        ) : (
          <div className="mt-6 space-y-3">
            {cars.map((car) => (
              <div
                key={car.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  {car.photo_url ? (
                    <img
                      src={car.photo_url}
                      alt="listing"
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-gray-200 text-xs text-gray-500">
                      No photo
                    </div>
                  )}
                  <div>
                    <p className="text-base font-semibold text-black">
                      {car.make || 'Unknown'} {car.model || ''}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      {car.variant || 'No variant'} {car.year ? `• ${car.year}` : ''}
                    </p>
                  </div>
                </div>

                <p className="mt-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                  Status: {car.status || 'draft'}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateStatus(car.id, 'draft')}
                    disabled={updatingId === car.id}
                    className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-black"
                  >
                    Draft
                  </button>

                  <button
                    type="button"
                    onClick={() => updateStatus(car.id, 'ready')}
                    disabled={updatingId === car.id}
                    className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-black"
                  >
                    Ready
                  </button>

                  <button
                    type="button"
                    onClick={() => updateStatus(car.id, 'sold')}
                    disabled={updatingId === car.id}
                    className="rounded-xl bg-black px-3 py-2 text-sm text-white"
                  >
                    Sold
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
