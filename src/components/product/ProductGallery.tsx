import { useState } from 'react';
import { ChevronLeft, ChevronRight, Youtube } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  youtubeIds?: string[];
  title: string;
}

export function ProductGallery({ images, youtubeIds = [], title }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isVideoTab, setIsVideoTab] = useState(false);

  const hasVideos = youtubeIds.length > 0;
  const allMedia = [...images];

  const handlePrevious = () => {
    if (isVideoTab) return;
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (isVideoTab) return;
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      {hasVideos && (
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setIsVideoTab(false)}
            className={`px-4 py-2 font-medium transition-colors ${
              !isVideoTab
                ? 'text-red-800 border-b-2 border-red-800'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Images
          </button>
          <button
            onClick={() => setIsVideoTab(true)}
            className={`px-4 py-2 font-medium transition-colors ${
              isVideoTab
                ? 'text-red-800 border-b-2 border-red-800'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Youtube className="h-5 w-5 inline mr-1" />
            Videos
          </button>
        </div>
      )}

      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
        {!isVideoTab ? (
          <>
            <img
              src={images[selectedIndex]}
              alt={`${title} - ${selectedIndex + 1}`}
              className="w-full h-full object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </>
        ) : (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeIds[0]}`}
            title={title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>

      {!isVideoTab && images.length > 1 && (
        <div className="grid grid-cols-6 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                selectedIndex === index
                  ? 'border-red-800'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img
                src={image}
                alt={`${title} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
