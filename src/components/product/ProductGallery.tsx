import { useState, useRef, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Youtube,
  Play,
  Maximize2,
  X,
  Crop,
  Square,
} from "lucide-react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

interface ProductImage {
  image_url: string;
  alt_text?: string;
}

interface ProductGalleryProps {
  images: ProductImage[];
  youtubeIds?: string[];
  title: string;
}

// Enhanced image preloader that ensures proper caching
const useImagePreloader = (
  imageUrls: string[],
  currentIndex: number,
  isActive: boolean
) => {
  const [loadedImages, setLoadedImages] = useState<Map<string, string>>(
    new Map()
  );
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  const preloadImage = useCallback(
    (src: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        // Return cached version if available
        if (loadedImages.has(src)) {
          resolve(src);
          return;
        }

        // Prevent duplicate loading
        if (loadingImages.has(src)) {
          return;
        }

        setLoadingImages((prev) => new Set(prev).add(src));

        // Use fetch to ensure proper caching
        fetch(src, {
          method: "GET",
          mode: "cors",
          cache: "force-cache", // Force browser to use cache
        })
          .then((response) => {
            if (!response.ok) throw new Error("Failed to load image");
            return response.blob();
          })
          .then((blob) => {
            const objectURL = URL.createObjectURL(blob);

            // Create image element and cache it
            const img = new Image();
            img.onload = () => {
              setLoadedImages((prev) => new Map(prev).set(src, objectURL));
              setLoadingImages((prev) => {
                const newSet = new Set(prev);
                newSet.delete(src);
                return newSet;
              });
              imageCache.current.set(src, img);
              resolve(objectURL);
            };
            img.onerror = () => {
              setLoadingImages((prev) => {
                const newSet = new Set(prev);
                newSet.delete(src);
                return newSet;
              });
              URL.revokeObjectURL(objectURL);
              reject(new Error(`Failed to load image: ${src}`));
            };
            img.src = objectURL;
          })
          .catch((error) => {
            setLoadingImages((prev) => {
              const newSet = new Set(prev);
              newSet.delete(src);
              return newSet;
            });
            reject(error);
          });
      });
    },
    [loadedImages, loadingImages]
  );

  // Alternative simpler approach - force browser cache reuse
  const preloadImageSimple = useCallback(
    (src: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        if (loadedImages.has(src)) {
          resolve(src);
          return;
        }

        if (loadingImages.has(src)) {
          return;
        }

        setLoadingImages((prev) => new Set(prev).add(src));

        const img = new Image();
        img.crossOrigin = "anonymous"; // Enable CORS if needed

        img.onload = () => {
          setLoadedImages((prev) => new Map(prev).set(src, src));
          setLoadingImages((prev) => {
            const newSet = new Set(prev);
            newSet.delete(src);
            return newSet;
          });
          imageCache.current.set(src, img);
          resolve(src);
        };

        img.onerror = () => {
          setLoadingImages((prev) => {
            const newSet = new Set(prev);
            newSet.delete(src);
            return newSet;
          });
          reject(new Error(`Failed to load image: ${src}`));
        };

        // Force cache by adding to DOM temporarily
        img.style.display = "none";
        document.body.appendChild(img);
        img.src = src;

        // Remove from DOM after loading
        img.onload = () => {
          document.body.removeChild(img);
          setLoadedImages((prev) => new Map(prev).set(src, src));
          setLoadingImages((prev) => {
            const newSet = new Set(prev);
            newSet.delete(src);
            return newSet;
          });
          resolve(src);
        };
      });
    },
    [loadedImages, loadingImages]
  );

  useEffect(() => {
    if (!isActive || imageUrls.length === 0) return;

    const preloadAdjacent = async () => {
      const preloadQueue: string[] = [];

      // Current image (highest priority)
      if (imageUrls[currentIndex]) {
        preloadQueue.push(imageUrls[currentIndex]);
      }

      // Next image
      const nextIndex =
        currentIndex === imageUrls.length - 1 ? 0 : currentIndex + 1;
      if (imageUrls[nextIndex]) {
        preloadQueue.push(imageUrls[nextIndex]);
      }

      // Previous image
      const prevIndex =
        currentIndex === 0 ? imageUrls.length - 1 : currentIndex - 1;
      if (imageUrls[prevIndex]) {
        preloadQueue.push(imageUrls[prevIndex]);
      }

      // Preload images
      for (const url of preloadQueue) {
        try {
          if (!loadedImages.has(url) && !loadingImages.has(url)) {
            await preloadImageSimple(url);
          }
        } catch (error) {
          console.warn("Failed to preload image:", url, error);
        }
      }
    };

    preloadAdjacent();
  }, [
    currentIndex,
    isActive,
    imageUrls,
    preloadImageSimple,
    loadedImages,
    loadingImages,
  ]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      loadedImages.forEach((objectURL, src) => {
        if (objectURL !== src) {
          // Only revoke object URLs we created
          URL.revokeObjectURL(objectURL);
        }
      });
    };
  }, []);

  return {
    loadedImages,
    isImageLoaded: (url: string) => loadedImages.has(url),
    isImageLoading: (url: string) => loadingImages.has(url),
    getCachedImageSrc: (url: string) => loadedImages.get(url) || url,
  };
};

export function ProductGallery({
  images,
  youtubeIds = [],
  title,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isVideoTab, setIsVideoTab] = useState(false);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [objectFit, setObjectFit] = useState<"cover" | "contain">("contain");

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const lightboxScrollRef = useRef<HTMLDivElement>(null);

  const hasVideos = youtubeIds.length > 0;
  const totalImages = images.length;
  const totalVideos = youtubeIds.length;

  // Extract image URLs for preloading
  const imageUrls = images.map((img) => img.image_url);

  // Use image preloader hook
  const { loadedImages, isImageLoaded, isImageLoading, getCachedImageSrc } =
    useImagePreloader(
      imageUrls,
      selectedIndex,
      true // Always preload for gallery
    );

  // Enhanced smooth scroll with better mobile support
  const scrollToSlide = useCallback(
    (index: number) => {
      if (!scrollContainerRef.current || index < 0 || index >= totalImages)
        return;

      const container = scrollContainerRef.current;
      const slideWidth = container.offsetWidth;
      const targetScrollLeft = index * slideWidth;

      try {
        container.scrollTo({
          left: targetScrollLeft,
          behavior: "smooth",
        });
      } catch (error) {
        container.scrollLeft = targetScrollLeft;
      }
    },
    [totalImages]
  );

  // Navigation functions
  const handlePrevious = useCallback(() => {
    if (isVideoTab) {
      const newIndex =
        selectedVideoIndex === 0 ? totalVideos - 1 : selectedVideoIndex - 1;
      setSelectedVideoIndex(newIndex);
    } else {
      const newIndex =
        selectedIndex === 0 ? totalImages - 1 : selectedIndex - 1;
      scrollToSlide(newIndex);
    }
  }, [
    isVideoTab,
    selectedIndex,
    selectedVideoIndex,
    totalImages,
    totalVideos,
    scrollToSlide,
  ]);

  const handleNext = useCallback(() => {
    if (isVideoTab) {
      const newIndex =
        selectedVideoIndex === totalVideos - 1 ? 0 : selectedVideoIndex + 1;
      setSelectedVideoIndex(newIndex);
    } else {
      const newIndex =
        selectedIndex === totalImages - 1 ? 0 : selectedIndex + 1;
      scrollToSlide(newIndex);
    }
  }, [
    isVideoTab,
    selectedIndex,
    selectedVideoIndex,
    totalImages,
    totalVideos,
    scrollToSlide,
  ]);

  // Enhanced intersection observer for better tracking
  useEffect(() => {
    if (!scrollContainerRef.current || isVideoTab) return;

    const container = scrollContainerRef.current;
    const slides = container.children;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const slideIndex = Array.from(slides).indexOf(
              entry.target as HTMLElement
            );
            if (slideIndex !== -1 && slideIndex !== selectedIndex) {
              setSelectedIndex(slideIndex);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.7,
        rootMargin: "0px",
      }
    );

    Array.from(slides).forEach((slide) => {
      observerRef.current?.observe(slide);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [isVideoTab, totalImages, selectedIndex]);

  // Update thumbnail scroll when selectedIndex changes
  const scrollToThumbnail = useCallback((index: number) => {
    if (!thumbnailsRef.current) return;

    const thumbnail = thumbnailsRef.current.children[index] as HTMLElement;
    if (!thumbnail) return;

    thumbnail.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, []);

  useEffect(() => {
    if (!isVideoTab) {
      scrollToThumbnail(selectedIndex);
    }
  }, [selectedIndex, isVideoTab, scrollToThumbnail]);

  // Lightbox functions
  const openLightbox = useCallback(() => {
    setIsLightboxOpen(true);
    document.body.style.overflow = "hidden";
    scrollToLightboxSlide(selectedIndex);
  }, []);

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false);
    document.body.style.overflow = "unset";
  }, []);

  // Add this ref for lightbox scrolling

  // Lightbox scroll to slide function
  const scrollToLightboxSlide = useCallback(
    (index: number) => {
      if (!lightboxScrollRef.current || index < 0 || index >= totalImages)
        return;

      const container = lightboxScrollRef.current;
      const slideWidth = container.offsetWidth;
      const targetScrollLeft = index * slideWidth;

      scrollToSlide(index); // Sync main gallery

      try {
        container.scrollTo({
          left: targetScrollLeft,
          behavior: "smooth",
        });
      } catch (error) {
        container.scrollLeft = targetScrollLeft;
      }
    },
    [totalImages]
  );

  // Enhanced lightbox navigation functions
  const handleLightboxPrevious = useCallback(() => {
    const newIndex = selectedIndex === 0 ? totalImages - 1 : selectedIndex - 1;
    scrollToLightboxSlide(newIndex);
  }, [selectedIndex, totalImages, scrollToLightboxSlide]);

  const handleLightboxNext = useCallback(() => {
    const newIndex = selectedIndex === totalImages - 1 ? 0 : selectedIndex + 1;
    scrollToLightboxSlide(newIndex);
  }, [selectedIndex, totalImages, scrollToLightboxSlide]);

  // Handle lightbox scroll events to update selectedIndex
  const handleLightboxScroll = useCallback(() => {
    if (!lightboxScrollRef.current) return;

    const container = lightboxScrollRef.current;
    const slideWidth = container.offsetWidth;
    const currentScroll = container.scrollLeft;
    const newIndex = Math.round(currentScroll / slideWidth);

    if (newIndex !== selectedIndex && newIndex >= 0 && newIndex < totalImages) {
      setSelectedIndex(newIndex);
    }
  }, [selectedIndex, totalImages]);

  // Set up intersection observer for lightbox
  useEffect(() => {
    if (!lightboxScrollRef.current || !isLightboxOpen) return;

    const container = lightboxScrollRef.current;
    const slides = container.children;

    const lightboxObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const slideIndex = Array.from(slides).indexOf(
              entry.target as HTMLElement
            );
          }
        });
      },
      {
        root: container,
        threshold: 0.7,
        rootMargin: "0px",
      }
    );

    Array.from(slides).forEach((slide) => {
      lightboxObserver.observe(slide);
    });

    return () => {
      lightboxObserver.disconnect();
    };
  }, [isLightboxOpen, totalImages, selectedIndex]);

  // Update keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleLightboxPrevious();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleLightboxNext();
      }
      if (e.key === "Escape") {
        closeLightbox();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isLightboxOpen,
    handleLightboxPrevious,
    handleLightboxNext,
    closeLightbox,
  ]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrevious();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") closeLightbox();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrevious, handleNext, closeLightbox]);

  return (
    <>
      <div className="space-y-4">
        {/* Tab Navigation */}
        {hasVideos && (
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setIsVideoTab(false)}
              className={`px-4 py-3 font-medium transition-all duration-200 relative ${
                !isVideoTab
                  ? "text-red-800 font-semibold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Images ({totalImages})
              {!isVideoTab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-800 rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setIsVideoTab(true)}
              className={`px-4 py-3 font-medium transition-all duration-200 relative flex items-center gap-2 ${
                isVideoTab
                  ? "text-red-800 font-semibold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Youtube className="h-4 w-4" />
              Videos ({totalVideos})
              {isVideoTab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-800 rounded-full"></div>
              )}
            </button>
          </div>
        )}

        {/* View Mode Controls */}
        {!isVideoTab && (
          <div className="flex justify-end gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setObjectFit("contain")}
                className={`p-2 rounded transition-colors ${
                  objectFit === "contain"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Fit entire image (no cropping)"
              >
                <Square className="h-4 w-4" />
              </button>
              <button
                onClick={() => setObjectFit("cover")}
                className={`p-2 rounded transition-colors ${
                  objectFit === "cover"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Fill container (may crop image)"
              >
                <Crop className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Gallery Container - Enhanced for Mobile */}
        <div className="relative group">
          {!isVideoTab ? (
            <div
              ref={scrollContainerRef}
              className={`
                flex overflow-x-auto
                ${objectFit === "contain" ? "min-h-[400px]" : "aspect-square"}
                bg-gray-100 rounded-xl
                scroll-smooth
                snap-x snap-mandatory
                touch-pan-x
                overscroll-x-contain
                scrollbar-hide
              `}
              style={{
                scrollSnapType: "x mandatory",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                touchAction: "auto",
                overscrollBehaviorX: "contain",
              }}
            >
              {images.map((image, index) => (
                <div
                  key={index}
                  className={`
                    flex-shrink-0 w-full snap-center snap-always
                    flex items-center justify-center relative
                    ${objectFit === "contain" ? "min-h-[400px]" : "h-full"}
                  `}
                  // onClick={openLightbox}
                  style={{
                    scrollSnapAlign: "center",
                    scrollSnapStop: "always",
                  }}
                >
                  <LazyLoadImage
                    src={getCachedImageSrc(image.image_url)}
                    alt={image.alt_text || `${title} - ${index + 1}`}
                    effect="blur"
                    wrapperClassName={`
                       select-none transition-opacity duration-300
                      ${
                        objectFit === "contain"
                          ? "max-w-full max-h-full object-contain"
                          : "w-full h-full object-cover"
                      }
                      ${
                        isImageLoaded(image.image_url)
                          ? "opacity-100"
                          : "opacity-90"
                      }
                    `}
                    className={`
                       select-none transition-opacity duration-300
                      ${
                        objectFit === "contain"
                          ? "max-w-full max-h-full object-contain"
                          : "w-full h-full object-cover"
                      }
                      ${
                        isImageLoaded(image.image_url)
                          ? "opacity-100"
                          : "opacity-90"
                      }
                    `}
                    style={
                      objectFit === "contain"
                        ? {
                            maxHeight: "600px",
                            width: "auto",
                            height: "auto",
                            touchAction: "manipulation",
                          }
                        : {
                            touchAction: "manipulation",
                          }
                    }
                  />
                  {/* <img
                    src={getCachedImageSrc(image.image_url)} // Use cached version
                    alt={image.alt_text || `${title} - ${index + 1}`}
                    className={`
                       select-none transition-opacity duration-300
                      ${
                        objectFit === "contain"
                          ? "max-w-full max-h-full object-contain"
                          : "w-full h-full object-cover"
                      }
                      ${
                        isImageLoaded(image.image_url)
                          ? "opacity-100"
                          : "opacity-90"
                      }
                    `}
                    style={
                      objectFit === "contain"
                        ? {
                            maxHeight: "600px",
                            width: "auto",
                            height: "auto",
                            touchAction: "manipulation",
                          }
                        : {
                            touchAction: "manipulation",
                          }
                    }
                    loading={
                      Math.abs(index - selectedIndex) <= 1 ? "eager" : "lazy"
                    }
                    draggable={false}
                  /> */}

                  {/* Zoom indicator */}
                  {/* {index === selectedIndex && (
                    <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <Maximize2 className="h-4 w-4" />
                    </div>
                  )} */}

                  {/* Loading indicator */}
                  {isImageLoading(image.image_url) &&
                    index === selectedIndex && (
                      <div className="absolute top-4 left-4 bg-blue-500/70 text-white px-2 py-1 rounded text-xs flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Loading...
                      </div>
                    )}
                </div>
              ))}
            </div>
          ) : (
            /* Video Content - keeping existing code */
            <div className="relative w-full aspect-square bg-gray-100 rounded-xl overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeIds[selectedVideoIndex]}?rel=0`}
                title={`${title} - Video ${selectedVideoIndex + 1}`}
                className="w-full h-full rounded-xl"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />

              {/* Video Navigation */}
              {totalVideos > 1 && (
                <>
                  <button
                    onClick={() => {
                      handlePrevious();
                      handleLightboxPrevious();
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 z-10"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => {
                      handleNext();
                      handleLightboxNext();
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 z-10"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm z-10">
                {selectedVideoIndex + 1} / {totalVideos}
              </div>
            </div>
          )}

          {/* Navigation Arrows for Images */}
          {!isVideoTab && totalImages > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm p-2 sm:p-3 rounded-full shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100 z-20"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm p-2 sm:p-3 rounded-full shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100 z-20"
                aria-label="Next image"
              >
                <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
              </button>
            </>
          )}

          {/* Image Counter */}
          {!isVideoTab && (
            <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm z-10">
              {selectedIndex + 1} / {totalImages}
            </div>
          )}

          {/* Object Fit Indicator */}
          {!isVideoTab && (
            <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 z-10">
              {objectFit === "contain" ? (
                <>
                  <Square className="h-3 w-3" />
                  <span className="hidden sm:inline">Full Image</span>
                </>
              ) : (
                <>
                  <Crop className="h-3 w-3" />
                  <span className="hidden sm:inline">Cropped</span>
                </>
              )}
            </div>
          )}

          {/* Progress Dots */}
          {!isVideoTab && totalImages > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === selectedIndex
                      ? "bg-white scale-110 shadow-lg"
                      : "bg-white/50 hover:bg-white/75"
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Thumbnails */}
        {!isVideoTab && totalImages > 1 && (
          <div className="relative">
            <div
              ref={thumbnailsRef}
              className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide p-2 scroll-smooth touch-pan-x"
              style={{
                scrollSnapType: "x proximity",
                touchAction: "auto",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => scrollToSlide(index)}
                  className={`
                    flex-shrink-0 aspect-square w-16 h-16 sm:w-20 sm:h-20 
                    rounded-lg overflow-hidden border-2 transition-all duration-300 relative
                    ${
                      selectedIndex === index
                        ? "border-red-800 ring-2 ring-red-800/20 scale-105 shadow-lg"
                        : "border-gray-200 hover:border-gray-300 hover:scale-105"
                    }
                  `}
                  style={{ scrollSnapAlign: "center" }}
                  aria-label={`View image ${index + 1}`}
                >
                  <LazyLoadImage
                    src={getCachedImageSrc(image.image_url)}
                    alt={`${title} thumbnail ${index + 1}`}
                    effect="blur"
                    wrapperClassName={`w-full h-full object-cover transition-all duration-300 ${
                      isImageLoaded(image.image_url)
                        ? "opacity-100"
                        : "opacity-80"
                    }`}
                    className={`w-full h-full object-cover transition-all duration-300 ${
                      isImageLoaded(image.image_url)
                        ? "opacity-100"
                        : "opacity-80"
                    }`}
                  />
                  {/* Loading indicator for thumbnails */}
                  {isImageLoading(image.image_url) && (
                    <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                      <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Video Thumbnails */}
        {isVideoTab && totalVideos > 1 && (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth">
            {youtubeIds.map((videoId, index) => (
              <button
                key={index}
                onClick={() => setSelectedVideoIndex(index)}
                className={`flex-shrink-0 relative aspect-video w-32 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                  selectedVideoIndex === index
                    ? "border-red-800 ring-2 ring-red-800/20 scale-105 shadow-lg"
                    : "border-gray-200 hover:border-gray-300 hover:scale-105"
                }`}
              >
                <LazyLoadImage
                  src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                  alt={`${title} video ${index + 1}`}
                  effect="blur"
                  wrapperClassName="w-full h-full object-cover"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Play className="h-6 w-6 text-white drop-shadow-lg" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Lightbox with Cached Images */}
      {isLightboxOpen && !isVideoTab && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center backdrop-blur-sm">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-[60] text-white/80 hover:text-white p-3 rounded-full bg-black/50 backdrop-blur-sm transition-all duration-200 z-60"
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="relative w-full h-full flex items-center justify-center">
            {/* Horizontal Scrollable Gallery */}
            <div
              ref={lightboxScrollRef}
              className="flex overflow-x-auto w-full h-full scrollbar-hide scroll-smooth snap-x snap-mandatory touch-pan-x overscroll-x-contain"
              style={{
                scrollSnapType: "x mandatory",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                touchAction: "pan-x pinch-zoom",
                overscrollBehaviorX: "contain",
              }}
              onScroll={handleLightboxScroll}
            >
              {images.map((image, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-full h-full snap-center snap-always flex items-center justify-center p-4"
                  style={{
                    scrollSnapAlign: "center",
                    scrollSnapStop: "always",
                  }}
                >
                  <div className="relative max-w-full max-h-full">
                    <img
                      src={getCachedImageSrc(image.image_url)}
                      alt={image.alt_text || `${title} - ${index + 1}`}
                      className={`max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${
                        isImageLoaded(image.image_url)
                          ? "opacity-100"
                          : "opacity-90"
                      }`}
                      style={{
                        maxWidth: "95vw",
                        maxHeight: "95vh",
                        touchAction: "pinch-zoom",
                      }}
                      draggable={false}
                    />

                    {/* Loading indicator for each image */}
                    {isImageLoading(image.image_url) && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading...</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Buttons */}
            {totalImages > 1 && (
              <>
                <button
                  onClick={() => {
                    handleLightboxPrevious();
                    handlePrevious();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 rounded-full bg-black/50 backdrop-blur-sm transition-all duration-200 z-50"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                <button
                  onClick={() => {
                    handleLightboxNext();
                    handleNext();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 rounded-full bg-black/50 backdrop-blur-sm transition-all duration-200 z-50"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              </>
            )}

            {/* Image Counter and Status */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
              <span>
                {selectedIndex + 1} / {totalImages}
              </span>
              {isImageLoaded(images[selectedIndex]?.image_url) && (
                <div
                  className="w-2 h-2 bg-green-400 rounded-full"
                  title="Cached"
                ></div>
              )}
            </div>

            {/* Thumbnail Navigation */}
            {totalImages > 1 && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full max-w-xs overflow-hidden">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => scrollToLightboxSlide(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 flex-shrink-0 ${
                        index === selectedIndex
                          ? "bg-white scale-125 shadow-lg"
                          : "bg-white/40 hover:bg-white/60"
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scroll-smooth {
          scroll-behavior: smooth;
        }
        .snap-x {
          scroll-snap-type: x mandatory;
        }
        .snap-center {
          scroll-snap-align: center;
        }
        .snap-always {
          scroll-snap-stop: always;
        }
        .touch-pan-x {
          touch-action: pan-x;
        }
        .overscroll-x-contain {
          overscroll-behavior-x: contain;
        }

        @media (max-width: 640px) {
          .scrollbar-hide {
            padding-bottom: env(safe-area-inset-bottom);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .scroll-smooth {
            scroll-behavior: auto;
          }

          .scrollbar-hide {
            scroll-behavior: auto;
          }

          .transition-all {
            transition: none;
          }
        }
      `}</style>
    </>
  );
}
