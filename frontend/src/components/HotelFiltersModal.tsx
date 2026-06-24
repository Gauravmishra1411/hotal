import { useState } from "react";

type HotelFiltersModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function HotelFiltersModal({ open, onClose }: HotelFiltersModalProps) {
  const [showMore, setShowMore] = useState(false);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      {/* Prevent click propagation to backdrop */}
      <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-3xl font-bold">Filters</h2>
          <button onClick={onClose} className="text-xl">
            ✕
          </button>
        </div>

        {/* Popular */}
        <div className="mt-6">
          <h3 className="mb-3 font-semibold">Popular</h3>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-full border px-4 py-2">5 Star</button>
            <button className="rounded-full border px-4 py-2">Pool</button>
            <button className="rounded-full border px-4 py-2">4.0+</button>
            <button className="rounded-full border px-4 py-2">Budget</button>
          </div>
        </div>

        {/* Deals */}
        <div className="mt-8 border-t pt-6">
          <h3 className="mb-3 font-semibold">Deals</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" /> Fully refundable
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" /> No prepayment needed
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" /> Properties with special offers
            </label>
          </div>
        </div>

        {/* Price */}
        <div className="mt-8 border-t pt-6">
          <h3 className="mb-3 font-semibold">Price</h3>
          <input type="range" min="0" max="13408" className="w-full" />
          <div className="mt-4 flex gap-3">
            <input type="number" placeholder="₹0" className="w-1/2 rounded border p-2" />
            <input type="number" placeholder="₹13408" className="w-1/2 rounded border p-2" />
          </div>
        </div>

        {/* Amenities */}
        <div className="mt-8 border-t pt-6">
          <h3 className="mb-3 font-semibold">Amenities</h3>
          <div className="space-y-3">
            <label className="flex gap-3"><input type="checkbox" /> Free Wifi</label>
            <label className="flex gap-3"><input type="checkbox" /> Breakfast Included</label>
            <label className="flex gap-3"><input type="checkbox" /> Free Parking</label>
            {/* Show more toggle */}
            <button
              type="button"
              onClick={() => setShowMore(!showMore)}
              className="mt-2 text-sm text-blue-600 underline"
            >
              {showMore ? "Show less" : "Show more"}
            </button>
            {showMore && (
              <ul className="mt-2 list-disc list-inside text-sm text-gray-600">
                <li>Lobby.jpg</li>
                <li>RoomView.png</li>
                <li>PoolArea.jpg</li>
                <li>Restaurant.png</li>
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 mt-10 flex justify-between border-t bg-white py-4">
          <button className="font-semibold underline">Clear all filters</button>
          <button className="rounded-full bg-green-900 px-8 py-3 text-white">Apply</button>
        </div>
      </div>
    </div>
  );
}
