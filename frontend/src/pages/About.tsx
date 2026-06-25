import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function About() {
  const [heroData, setHeroData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'dynamic_sections'), where('sectionId', '==', 'about-hero'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setHeroData(snapshot.docs[0].data());
      } else {
        setHeroData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return null;
  if (heroData?.status === 'disabled') return null;

  return (
    <section className="page-section py-24 px-6 lg:px-16 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="rounded-3xl overflow-hidden shadow-xl h-[400px] bg-gray-100">
          <img 
            src={heroData?.imageUrl || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80"} 
            alt="Lobby Lounge" 
            className="w-full h-full object-cover" 
          />
        </div>
        <div className="space-y-6">
          <span className="text-sm font-bold uppercase tracking-widest text-[#d4af37]">
            {heroData?.subheading || "About Us"}
          </span>
          <h2 className="text-4xl font-serif text-gray-900 dark:text-white">
            {heroData?.heading || "Crafting Moments of Pure Leisure"}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {heroData?.paragraph1 || "Aurora Haven is built upon custom design, premium hospitality, and architectural elegance. Tucked into carefully chosen global viewpoints, our suites are designed to harmonize with nature."}
          </p>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {heroData?.paragraph2 || "Whether relaxing in our high-end spas or enjoying gourmet dining sourced locally, we verify every detail of your visit matches our standards."}
          </p>
        </div>
      </div>
    </section>
  );
}
