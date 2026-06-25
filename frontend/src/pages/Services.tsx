export default function Services() {
  return (
    <section className="page-section py-24 px-6 lg:px-16 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <span className="text-sm font-bold uppercase tracking-widest text-[#d4af37]">World-class Amenities</span>
        <h2 className="text-4xl font-serif text-gray-900 dark:text-white mt-2">Curated for Your Comfort</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition">
          <div className="w-12 h-12 bg-yellow-50 dark:bg-gray-700 rounded-xl flex items-center justify-center text-[#d4af37] text-2xl mb-6">🧘‍♀️</div>
          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Spa & Wellness</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Indulge in organic body therapies, thermal steam suites, and wellness plans overseen by professional therapists.</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition">
          <div className="w-12 h-12 bg-yellow-50 dark:bg-gray-700 rounded-xl flex items-center justify-center text-[#d4af37] text-2xl mb-6">🍽️</div>
          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Fine Dining</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Taste curated dishes made by award-winning chefs using local ingredients in sea-view open restaurants.</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition">
          <div className="w-12 h-12 bg-yellow-50 dark:bg-gray-700 rounded-xl flex items-center justify-center text-[#d4af37] text-2xl mb-6">⛵</div>
          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Private Charter</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Discover hidden coastal caves and tranquil shores with customizable private yachts and local guides.</p>
        </div>
      </div>
    </section>
  );
}
