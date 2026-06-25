import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function Amenities() {
  const [data, setData] = useState<any>({
    dining: { title: "Gourmet Dining", description: "Fresh local seafood and premium wines.", imageUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1000&q=80" },
    spa: { title: "Spa & Wellness", description: "Rejuvenating wellness treatments.", imageUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80" },
    activities: { title: "Excursions", description: "Private boat charters and island tours.", imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80" },
    offers: { title: "Special Offers", description: "Exclusive seasonal packages.", imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80" }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const q = query(collection(db, 'amenities'));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const fetchedData: any = { ...data }; // start with defaults
          querySnapshot.forEach((doc) => {
            const item = doc.data();
            if (item.sectionId && fetchedData[item.sectionId]) {
              fetchedData[item.sectionId] = {
                title: item.title || fetchedData[item.sectionId].title,
                description: item.description || fetchedData[item.sectionId].description,
                imageUrl: item.imageUrl || fetchedData[item.sectionId].imageUrl
              };
            }
          });
          setData(fetchedData);
        }
      } catch (err) {
        console.error("Error fetching amenities:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (loading) {
    return <div className="text-center py-40 min-h-screen text-gray-500 font-serif text-xl">Loading luxury details...</div>;
  }

  return (
    <div className="bg-[#faf9f7] min-h-screen pt-32 pb-24">
      <div className="space-y-32 px-6 lg:px-16 max-w-7xl mx-auto">
        
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <span className="text-sm font-bold uppercase tracking-widest text-[#d4af37]">Experiences</span>
          <h1 className="text-5xl md:text-6xl font-serif text-gray-900 mt-4 mb-6">Discover Our World</h1>
          <p className="text-gray-600 text-lg leading-relaxed">Immerse yourself in unparalleled luxury. From world-class dining to rejuvenating spa treatments, every moment is crafted to perfection.</p>
        </div>

        {/* 1. DINING SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="space-y-6 order-2 lg:order-1">
            <span className="text-sm font-bold uppercase tracking-widest text-[#d4af37]">Culinary Artistry</span>
            <h2 className="text-4xl font-serif text-gray-900">{data.dining.title}</h2>
            <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">{data.dining.description}</p>
          </div>
          <div className="rounded-3xl overflow-hidden h-[450px] shadow-2xl order-1 lg:order-2 transform transition-transform duration-700 hover:scale-[1.02]">
            <img src={data.dining.imageUrl} alt="Dining" className="w-full h-full object-cover" />
          </div>
        </section>

        {/* 2. SPA & WELLNESS SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="rounded-3xl overflow-hidden h-[450px] shadow-2xl transform transition-transform duration-700 hover:scale-[1.02]">
            <img src={data.spa.imageUrl} alt="Spa" className="w-full h-full object-cover" />
          </div>
          <div className="space-y-6">
            <span className="text-sm font-bold uppercase tracking-widest text-[#d4af37]">Tranquility</span>
            <h2 className="text-4xl font-serif text-gray-900">{data.spa.title}</h2>
            <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">{data.spa.description}</p>
          </div>
        </section>

        {/* 3. EXCURSIONS / ACTIVITIES SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="space-y-6 order-2 lg:order-1">
            <span className="text-sm font-bold uppercase tracking-widest text-[#d4af37]">Adventures</span>
            <h2 className="text-4xl font-serif text-gray-900">{data.activities.title}</h2>
            <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">{data.activities.description}</p>
          </div>
          <div className="rounded-3xl overflow-hidden h-[450px] shadow-2xl order-1 lg:order-2 transform transition-transform duration-700 hover:scale-[1.02]">
            <img src={data.activities.imageUrl} alt="Activities" className="w-full h-full object-cover" />
          </div>
        </section>

        {/* 4. SPECIAL OFFERS SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="rounded-3xl overflow-hidden h-[450px] shadow-2xl transform transition-transform duration-700 hover:scale-[1.02]">
            <img src={data.offers.imageUrl} alt="Offers" className="w-full h-full object-cover" />
          </div>
          <div className="space-y-6">
            <span className="text-sm font-bold uppercase tracking-widest text-[#d4af37]">Exclusive Rewards</span>
            <h2 className="text-4xl font-serif text-gray-900">{data.offers.title}</h2>
            <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">{data.offers.description}</p>
          </div>
        </section>

      </div>
    </div>
  );
}
