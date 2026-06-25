import SearchBar from '../components/SearchBar';
import CloudinaryImageSlider from '../components/cloudinaryimageulr';
import ServicesSection from '../components/ServicesSection';
import FilterSection from '../components/FilterSection';
import HotelCards from '../components/HotelCards';
import BlogSection from '../components/BlogSection';

interface HomeProps {
  user: any;
  onOpenLogin: () => void;
}

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';

export default function Home({ user, onOpenLogin }: HomeProps) {
  const [heroData, setHeroData] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'dynamic_sections'), where('sectionId', '==', 'home-hero'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const activeDocs = snapshot.docs
          .map(doc => doc.data())
          .filter(data => data.status !== 'disabled');
        setHeroData(activeDocs);
      } else {
        setHeroData([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (heroData.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroData.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [heroData.length]);

  return (
    <div className="relative min-h-screen">
      {/* PAGE 1: HOME - DYNAMIC CAROUSEL */}
      {!loading && heroData.length > 0 && (
        <section id="page-home" className="page-section py-12 px-6 lg:px-16 max-w-7xl mx-auto relative min-h-[500px]">
          {heroData.map((hero, index) => (
            <div 
              key={index} 
              className={`transition-opacity duration-1000 w-full ${
                index === currentIndex ? 'opacity-100 z-10 relative' : 'opacity-0 z-0 absolute top-0 left-0 pointer-events-none'
              }`}
            >
              <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center pt-8 lg:pt-12">
                
                {/* Mobile Heading (Hidden on Desktop) */}
                <div className="lg:hidden space-y-4 w-full text-center md:text-left">
                  <span className="text-sm font-bold uppercase tracking-widest text-[#d4af37]">
                    {hero.subheading || "Exclusive Sanctuary"}
                  </span>
                  <h1 className="text-4xl md:text-5xl font-serif text-gray-900 dark:text-white leading-tight">
                    {hero.heading || "Your gateway to peaceful luxury"}
                  </h1>
                </div>
                {/* Left Column for Desktop (Heading + Desc + Btn), Desc + Btn for Mobile */}
                <div className="space-y-6 flex flex-col justify-center order-3 lg:order-1 text-center md:text-left">
                  {/* Desktop Heading (Hidden on Mobile) */}
                  <div className="hidden lg:block space-y-6">
                    <span className="text-sm font-bold uppercase tracking-widest text-[#d4af37]">
                      {hero.subheading || "Exclusive Sanctuary"}
                    </span>
                    <h1 className="text-5xl lg:text-6xl font-serif text-gray-900 dark:text-white leading-tight">
                      {hero.heading || "Your gateway to peaceful luxury"}
                    </h1>
                  </div>

                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg whitespace-pre-wrap">
                    {hero.paragraph1 || "Experience our beautifully-designed locations overlooking Menorca’s coastal horizons. Plan your perfect escape today."}
                  </p>
                  <div className="pt-2">
                    <Link to={hero.buttonLink || "/services"} className="bg-[#d4af37] text-white font-medium px-8 py-3.5 rounded-lg shadow-md hover:bg-yellow-600 transition inline-block">
                      {hero.buttonText || "Explore Suites"}
                    </Link>
                  </div>
                </div>

                {/* Image Section */}
                <div className="rounded-3xl overflow-hidden shadow-2xl h-[300px] lg:h-[450px] w-full bg-gray-100 relative group order-2 lg:order-2">
                  <img 
                    src={hero.imageUrl || "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80"} 
                    alt={hero.heading || "Hero section"} 
                    className="w-full h-full object-cover transition-transform duration-10000 group-hover:scale-105" 
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Navigation Dots */}
          {heroData.length > 1 && (
            <div className="flex justify-center space-x-3 mt-12 z-20 relative">
              {heroData.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    currentIndex === idx ? 'bg-[#d4af37] scale-125' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Spacer removed because the active slide is now relative and dictates height correctly */}
      
      <main className="pb-8 pt-8">
        <SearchBar />
        <CloudinaryImageSlider />
        <ServicesSection />
        <FilterSection />
        
        <HotelCards 
          user={user} 
          onOpenLogin={onOpenLogin} 
        />

        <BlogSection />
      </main>
    </div>
  );
}
