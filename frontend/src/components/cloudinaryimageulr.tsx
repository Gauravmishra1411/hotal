import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "../firebase";

// Using Cloudinary fetch URLs to provide beautiful hotel imagery
// Default backup images if Firebase is empty
const DEFAULT_IMAGES = [
    {
        src: "https://res.cloudinary.com/ddthlutz4/image/upload/v1781347741/gufq4zkryr5mxqr0v1eh.jpg",
        thumb: "https://res.cloudinary.com/ddthlutz4/image/upload/v1781347741/gufq4zkryr5mxqr0v1eh.jpg",
        caption: "Luxury Resort & Spa",
    },
    {
        src: "https://res.cloudinary.com/ddthlutz4/image/upload/v1781347740/r2woxdtwmci61glwsyvu.webp",
        thumb: "https://res.cloudinary.com/ddthlutz4/image/upload/v1781347740/r2woxdtwmci61glwsyvu.webp",
        caption: "Premium Suite Interior",
    },
    {
        src: "https://res.cloudinary.com/ddthlutz4/image/upload/v1781347740/ghxqxqxfqortduojorvx.jpg",
        thumb: "https://res.cloudinary.com/ddthlutz4/image/upload/v1781347740/ghxqxqxfqortduojorvx.jpg",
        caption: "Ocean View Elegance",
    },
];

export default function CloudinaryImageSlider() {
    const [current, setCurrent] = useState(0);
    const [sliderImages, setSliderImages] = useState<any[]>(DEFAULT_IMAGES);
    const [heroContent, setHeroContent] = useState<any>(null);

    const nextSlide = () => {
        setSliderImages((prevImages) => {
            if (prevImages.length === 0) return prevImages;
            setCurrent((prev) => (prev + 1) % prevImages.length);
            return prevImages;
        });
    };

    const prevSlide = () => {
        setSliderImages((prevImages) => {
            if (prevImages.length === 0) return prevImages;
            setCurrent((prev) => (prev - 1 + prevImages.length) % prevImages.length);
            return prevImages;
        });
    };

    useEffect(() => {
        const fetchHeroContent = async () => {
            try {
                const querySnapshot = await getDocs(query(collection(db, 'hero_content')));
                if (!querySnapshot.empty) {
                    setHeroContent({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
                }
            } catch (error) {
                console.error("Error fetching hero content:", error);
            }
        };
        fetchHeroContent();
    }, []);

    useEffect(() => {
        const fetchSlides = async () => {
            try {
                const querySnapshot = await getDocs(query(collection(db, 'hero_slides')));
                if (!querySnapshot.empty) {
                    const fetchedSlides = querySnapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            src: data.imageUrl,
                            thumb: data.imageUrl,
                            caption: data.caption || ""
                        };
                    });
                    setSliderImages(fetchedSlides);
                } else {
                    setSliderImages(DEFAULT_IMAGES);
                }
            } catch (error) {
                console.error("Error fetching hero slides:", error);
                setSliderImages(DEFAULT_IMAGES);
            }
        };
        fetchSlides();
    }, []);

    // Auto-slide every 3.5 seconds
    useEffect(() => {
        if (sliderImages.length <= 1) return;
        const slideInterval = setInterval(() => {
            setCurrent((prev) => (prev + 1) % sliderImages.length);
        }, 3500);
        return () => clearInterval(slideInterval);
    }, [sliderImages.length]);

    if (sliderImages.length === 0) return null;

    return (
        <div className="relative w-full mb-8 z-10 -mt-24">
            {/* Main Image Container */}
            <div className="relative overflow-hidden group">

                {/* Images with crossfade animation */}
                <div className="relative h-[55vh] md:h-[90vh] w-full">
                    {sliderImages.map((image, index) => (
                        <img
                            key={index}
                            src={image.src}
                            alt={image.caption}
                            className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                                current === index 
                                    ? "opacity-100 z-0 scale-100 animate-kenburns" 
                                    : "opacity-0 -z-10"
                            }`}
                        />
                    ))}
                    {/* Gradient overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent z-0"></div>
                </div>

                {/* Dynamic Hero Text Overlay */}
                <div key={current} className="absolute top-1/2 -translate-y-1/2 left-[5%] md:left-[10%] max-w-2xl z-10 text-white animate-slide-up">
                    {heroContent?.subheading && (
                        <p className="text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase mb-3 text-gray-300">
                            {heroContent.subheading}
                        </p>
                    )}
                    {heroContent?.heading && (
                        <h1 className="text-3xl md:text-7xl font-serif leading-tight mb-4 tracking-wide drop-shadow-md">
                            {heroContent.heading}
                        </h1>
                    )}
                    {heroContent?.paragraph && (
                        <p className="text-sm md:text-xl text-gray-200 leading-relaxed max-w-lg drop-shadow-sm font-light">
                            {heroContent.paragraph}
                        </p>
                    )}
                </div>

                {/* Navigation Buttons */}
                <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 transform hover:scale-110"
                >
                    <ChevronLeft size={24} />
                </button>

                <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 transform hover:scale-110"
                >
                    <ChevronRight size={24} />
                </button>

                {/* Caption Overlay */}
                <div className="absolute bottom-6 left-6 z-20 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg">
                    <p className="text-white text-xs font-medium tracking-wider uppercase">
                        {sliderImages[current]?.caption || "LuxeStay"}
                    </p>
                </div>
            </div>

            {/* Thumbnails Overlay */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex justify-center gap-3 z-10">
                {sliderImages.map((image, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrent(index)}
                        className={`relative overflow-hidden rounded-lg transition-all duration-300 w-16 h-12 md:w-24 md:h-16 border-2 ${current === index
                            ? "border-white scale-105"
                            : "border-transparent opacity-60 hover:opacity-100 grayscale hover:grayscale-0"
                            }`}
                    >
                        <img
                            src={image.thumb}
                            alt={image.caption}
                            className="w-full h-full object-cover"
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}
