import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  image_url?: string;
  cta_text?: string;
  cta_link?: string;
}

interface HeroCarouselProps {
  slides: Slide[];
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  if (slides.length === 0) {
    return (
      <div className="relative h-[400px] md:h-[600px] bg-gradient-to-r from-red-100 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Welcome to VaniSarees
          </h1>
          <p className="text-xl text-gray-700">Discover Elegance & Tradition</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[400px] md:h-[600px] overflow-hidden group">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
            index === currentSlide
              ? 'opacity-100 translate-x-0'
              : index < currentSlide
              ? 'opacity-0 -translate-x-full'
              : 'opacity-0 translate-x-full'
          }`}
        >
          <img
            src={slide.image_url || 'https://images.pexels.com/photos/1164674/pexels-photo-1164674.jpeg'}
            alt={slide.title}
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="max-w-2xl text-white">
                <h2 className="text-4xl md:text-6xl font-bold mb-4 animate-slideInLeft">
                  {slide.title}
                </h2>
                {slide.subtitle && (
                  <p className="text-lg md:text-xl mb-8 animate-slideInLeft animation-delay-200">
                    {slide.subtitle}
                  </p>
                )}
                {slide.cta_text && slide.cta_link && (
                  <a
                    href={slide.cta_link}
                    className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg animate-slideInLeft animation-delay-400"
                  >
                    {slide.cta_text}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {slides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-300 opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-300 opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-6 h-6 text-gray-900" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
