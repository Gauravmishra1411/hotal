import React from 'react';

const galleryImages = [
  { id: 1, category: 'Rooms', src: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80', title: 'Signature Suite' },
  { id: 2, category: 'Property', src: 'https://images.unsplash.com/photo-1542314831-c6a4d14d8373?auto=format&fit=crop&w=1200&q=80', title: 'Main Pool' },
  { id: 3, category: 'Food', src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80', title: 'Fine Dining' },
  { id: 4, category: 'Grounds', src: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', title: 'Lush Gardens' },
  { id: 5, category: 'Rooms', src: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80', title: 'Ocean View Room' },
  { id: 6, category: 'Spa', src: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80', title: 'Wellness Spa' },
  { id: 7, category: 'Food', src: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80', title: 'Signature Cocktails' },
  { id: 8, category: 'Property', src: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80', title: 'Evening Ambiance' },
];

export default function Gallery() {
  const [activeCategory, setActiveCategory] = React.useState('All');
  const categories = ['All', 'Rooms', 'Property', 'Food', 'Grounds', 'Spa'];

  const filteredImages = activeCategory === 'All' 
    ? galleryImages 
    : galleryImages.filter(img => img.category === activeCategory);

  return (
    <div className="bg-neutral-50 min-h-screen py-32 px-6 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sm font-bold uppercase tracking-widest text-[#d4af37]">Discover Our World</span>
          <h1 className="text-4xl md:text-5xl font-serif text-gray-900 mt-4 mb-6">Gallery</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore the exquisite details of our sanctuaries, world-class dining, and breathtaking surroundings.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                activeCategory === category 
                  ? 'bg-gray-900 text-white shadow-md' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredImages.map((image) => (
            <div key={image.id} className="group relative overflow-hidden rounded-2xl aspect-[4/5] cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500">
              <img 
                src={image.src} 
                alt={image.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <span className="text-[#d4af37] text-xs font-bold uppercase tracking-wider mb-1">{image.category}</span>
                <h3 className="text-white text-xl font-serif">{image.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
