import { useState } from "react";
import { MapPin, SlidersHorizontal, ChevronDown, Award } from "lucide-react";
import HotelFiltersModal from "./HotelFiltersModal";

export default function HotelFilters() {
    const [showFilters, setShowFilters] = useState(false);

    const buttonBase = "flex items-center gap-2 rounded-full border border-green-900 px-5 py-2 text-green-900 hover:bg-green-50 flex-shrink-0";
    const primaryBtn = "flex items-center gap-2 rounded-full bg-green-900 px-5 py-2 text-white flex-shrink-0";
    const smallBtn = "rounded-full border border-green-900 px-5 py-2 text-green-900 hover:bg-green-50 flex-shrink-0";

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6">
            <div className="flex overflow-x-auto scrollbar-none items-center gap-3 bg-white/80 dark:bg-gray-900/50 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                {/* Map */}
                <button className={primaryBtn}>
                    <MapPin size={16} />
                    <span>Map</span>
                </button>

                {/* Filters */}
                <button onClick={() => setShowFilters(true)} className={buttonBase}>
                    <SlidersHorizontal size={16} />
                    <span>Filters • 1</span>
                </button>

                {/* Price */}
                <button className={buttonBase}>
                    <span>Price</span>
                    <ChevronDown size={16} />
                </button>

                {/* Amenities */}
                <button className={buttonBase}>
                    <span>Amenities</span>
                    <ChevronDown size={16} />
                </button>

                {/* 5 Star */}
                <button className={smallBtn}>5 Star</button>

                {/* Pool */}
                <button className={smallBtn}>Pool</button>

                {/* Rating */}
                <button className={buttonBase}>
                    <div className="flex gap-1">
                        <span className="h-3 w-3 rounded-full bg-green-500"></span>
                        <span className="h-3 w-3 rounded-full bg-green-500"></span>
                        <span className="h-3 w-3 rounded-full bg-green-500"></span>
                        <span className="h-3 w-3 rounded-full bg-green-500"></span>
                        <span className="h-3 w-3 rounded-full border-2 border-green-500"></span>
                    </div>
                    <span>4.0+</span>
                </button>

                {/* Budget */}
                <button className={smallBtn}>Budget</button>

                {/* Travellers Choice */}
                <button className={buttonBase}>
                    <div className="rounded bg-green-500 p-1 text-white">
                        <Award size={14} />
                    </div>
                    <span>Travellers' Choice</span>
                </button>
            </div>
            {/* Modal drawer */}
            <HotelFiltersModal open={showFilters} onClose={() => setShowFilters(false)} />
        </div>
    );
}
