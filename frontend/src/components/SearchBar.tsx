import { Search, MapPin, Calendar, Users } from 'lucide-react';

export default function SearchBar() {
  return (
    <div className="w-[92%] sm:w-[85%] md:w-[80%] max-w-5xl mx-auto -mt-6 mb-8 relative z-20">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 md:p-6 flex flex-col md:flex-row items-center gap-4 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
        
        {/* Destination */}
        <div className="flex-1 w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
          <MapPin className="text-gray-400 group-hover:text-blue-500 transition-colors" size={20} />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location</span>
            <input 
              type="text" 
              placeholder="Where are you going?" 
              className="bg-transparent border-none outline-none text-sm md:text-base font-medium text-gray-900 dark:text-white placeholder-gray-400 mt-0.5 w-full"
            />
          </div>
        </div>

        {/* Separator (Hidden on mobile) */}
        <div className="hidden md:block w-px h-12 bg-gray-200 dark:bg-gray-700"></div>

        {/* Dates */}
        <div className="flex-1 w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
          <Calendar className="text-gray-400 group-hover:text-blue-500 transition-colors" size={20} />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Check in - Check out</span>
            <span className="text-sm md:text-base font-medium text-gray-400 mt-0.5 truncate">Add dates</span>
          </div>
        </div>

        {/* Separator (Hidden on mobile) */}
        <div className="hidden md:block w-px h-12 bg-gray-200 dark:bg-gray-700"></div>

        {/* Guests */}
        <div className="flex-1 w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
          <Users className="text-gray-400 group-hover:text-blue-500 transition-colors" size={20} />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Guests</span>
            <span className="text-sm md:text-base font-medium text-gray-400 mt-0.5 truncate">Add guests</span>
          </div>
        </div>

        {/* Search Button */}
        <button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white p-4 md:px-8 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 flex-shrink-0 hover:scale-[1.02]">
          <Search size={20} />
          <span className="md:hidden lg:inline">Search</span>
        </button>
      </div>
    </div>
  );
}
