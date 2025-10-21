import React, { useState, useEffect } from "react";
import { X, Sparkles, Heart, Star } from "lucide-react";
import Shuffle from "../ui/shadcn-io/shuffle";

interface VaniSareesAnimationDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  variant?: "welcome" | "loading" | "success" | "brand" | "celebration";
  showSubtitle?: boolean;
  subtitle?: string;
  autoClose?: number; // Auto close after X milliseconds
  showCloseButton?: boolean;
  backdropBlur?: boolean;
  theme?: "elegant" | "traditional" | "modern" | "festive";
}

const VaniSareesAnimationDialog: React.FC<VaniSareesAnimationDialogProps> = ({
  isOpen,
  onClose,
  variant = "brand",
  showSubtitle = true,
  subtitle,
  autoClose,
  showCloseButton = true,
  backdropBlur = true,
  theme = "elegant",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<
    "enter" | "display" | "exit"
  >("enter");

  const [key, setKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setKey((prev) => prev + 1);
    }, 2000); // 🔁 loop interval (adjust to match duration)

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setAnimationPhase("enter");

      // Transition to display phase
      const displayTimer = setTimeout(() => {
        setAnimationPhase("display");
      }, 200);

      // Auto close if specified
      if (autoClose) {
        const closeTimer = setTimeout(() => {
          handleClose();
        }, autoClose);

        return () => {
          clearTimeout(displayTimer);
          clearTimeout(closeTimer);
        };
      }

      return () => {
        clearTimeout(displayTimer);
      };
    } else {
      handleClose();
    }
  }, [isOpen, autoClose]);

  const handleClose = () => {
    setAnimationPhase("exit");
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 500);
  };

  const getThemeConfig = () => {
    switch (theme) {
      case "traditional":
        return {
          bgGradient: "from-red-50 via-orange-50 to-yellow-50",
          borderColor: "border-red-200",
          textColor: "text-red-800",
          accentColor: "text-orange-600",
          decorativeColors: [
            "text-red-500",
            "text-orange-500",
            "text-yellow-500",
          ],
        };
      case "modern":
        return {
          bgGradient: "from-gray-50 via-white to-gray-50",
          borderColor: "border-gray-200",
          textColor: "text-gray-800",
          accentColor: "text-blue-600",
          decorativeColors: [
            "text-blue-500",
            "text-purple-500",
            "text-pink-500",
          ],
        };
      case "festive":
        return {
          bgGradient: "from-pink-50 via-purple-50 to-indigo-50",
          borderColor: "border-pink-200",
          textColor: "text-purple-800",
          accentColor: "text-pink-600",
          decorativeColors: [
            "text-pink-500",
            "text-purple-500",
            "text-indigo-500",
          ],
        };
      default: // elegant
        return {
          bgGradient: "from-rose-50 via-pink-50 to-rose-50",
          borderColor: "border-rose-200",
          textColor: "text-rose-800",
          accentColor: "text-pink-600",
          decorativeColors: ["text-rose-500", "text-pink-500", "text-red-500"],
        };
    }
  };

  const getVariantConfig = () => {
    switch (variant) {
      case "welcome":
        return {
          subtitle:
            subtitle || "Welcome to our collection of timeless elegance",
          showDecorations: true,
          showSparkles: true,
        };
      case "loading":
        return {
          subtitle: subtitle || "Preparing something beautiful for you...",
          showDecorations: false,
          showSparkles: true,
        };
      case "success":
        return {
          subtitle: subtitle || "Thank you for choosing Vani Sarees",
          showDecorations: true,
          showSparkles: true,
        };
      case "celebration":
        return {
          subtitle: subtitle || "Celebrating the art of traditional wear",
          showDecorations: true,
          showSparkles: true,
        };
      default:
        return {
          subtitle: subtitle || "Timeless elegance, modern style",
          showDecorations: true,
          showSparkles: false,
        };
    }
  };

  if (!isVisible) return null;

  const themeConfig = getThemeConfig();
  const variantConfig = getVariantConfig();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 z-40 transition-all duration-500
          ${animationPhase === "enter" ? "bg-black/0" : "bg-black/60"}
          ${
            backdropBlur && animationPhase !== "enter" ? "backdrop-blur-sm" : ""
          }
        `}
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div
          className={`
          relative w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl
          mx-auto
          bg-gradient-to-br ${themeConfig.bgGradient}
          border-2 ${themeConfig.borderColor}
          rounded-2xl sm:rounded-3xl shadow-2xl
          transform transition-all duration-700 ease-out
          ${
            animationPhase === "enter"
              ? "scale-50 opacity-0 rotate-3"
              : animationPhase === "exit"
              ? "scale-110 opacity-0 -rotate-2"
              : "scale-100 opacity-100 rotate-0"
          }
        `}
        >
          {/* Close Button */}
          {showCloseButton && (
            <button
              onClick={handleClose}
              className={`
                absolute top-3 right-3 sm:top-4 sm:right-4 z-10
                p-2 sm:p-2 rounded-full bg-white/80 hover:bg-white
                ${themeConfig.textColor} hover:scale-110
                transition-all duration-200 shadow-sm
                touch-manipulation
              `}
              aria-label="Close"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Decorative Elements - Hidden on mobile for cleaner look */}
          {variantConfig.showDecorations && (
            <>
              {/* Top decorative border - Responsive sizing */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden sm:block">
                <div
                  className={`w-12 h-6 sm:w-16 sm:h-8 bg-gradient-to-r ${themeConfig.bgGradient} border ${themeConfig.borderColor} rounded-full flex items-center justify-center`}
                >
                  <Heart
                    className={`w-3 h-3 sm:w-4 sm:h-4 ${themeConfig.accentColor}`}
                  />
                </div>
              </div>

              {/* Corner decorations - Hidden on small mobile */}
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6 opacity-20 sm:opacity-30 hidden xs:block">
                <Star
                  className={`w-4 h-4 sm:w-6 sm:h-6 ${themeConfig.decorativeColors[0]} animate-pulse`}
                />
              </div>
              <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 opacity-20 sm:opacity-30 hidden xs:block">
                <Star
                  className={`w-4 h-4 sm:w-6 sm:h-6 ${themeConfig.decorativeColors[1]} animate-pulse`}
                  style={{ animationDelay: "0.5s" }}
                />
              </div>
            </>
          )}

          {/* Floating Sparkles - Reduced on mobile */}
          {variantConfig.showSparkles && (
            <div className="absolute inset-0 overflow-hidden rounded-2xl sm:rounded-3xl pointer-events-none">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute animate-float ${
                    themeConfig.decorativeColors[i % 3]
                  } hidden sm:block`}
                  style={{
                    left: `${25 + i * 15}%`,
                    top: `${20 + i * 10}%`,
                    animationDelay: `${i * 0.4}s`,
                    animationDuration: "3s",
                  }}
                >
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 opacity-30 sm:opacity-40" />
                </div>
              ))}
              {/* Mobile sparkles - fewer and smaller */}
              {[...Array(2)].map((_, i) => (
                <div
                  key={`mobile-${i}`}
                  className={`absolute animate-float ${
                    themeConfig.decorativeColors[i % 3]
                  } block sm:hidden`}
                  style={{
                    left: `${30 + i * 40}%`,
                    top: `${25 + i * 15}%`,
                    animationDelay: `${i * 0.6}s`,
                    animationDuration: "3s",
                  }}
                >
                  <Sparkles className="w-3 h-3 opacity-20" />
                </div>
              ))}
            </div>
          )}

          {/* Main Content */}
          <div className="relative px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-12 lg:px-12 lg:py-16 text-center">
            {/* Main Brand Text with Shuffle Animation */}
            <div className="mb-4 sm:mb-6 md:mb-8">
              <Shuffle
                key={key}
                text="VANI SAREES"
                shuffleDirection="right"
                duration={0.7}
                animationMode="evenodd"
                shuffleTimes={3}
                ease="power3.out"
                stagger={0.05}
                threshold={0.1}
                triggerOnce={false}
                triggerOnHover={false}
                respectReducedMotion={true}
                className={`font-bold ${themeConfig.textColor} tracking-wide sm:tracking-wider whitespace-nowrap`}
                style={{
                  fontSize: "clamp(1.5rem, 8vw, 5rem)", // More aggressive mobile scaling
                  fontFamily: "serif",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.1)",
                  lineHeight: "1.1", // Tighter line height for mobile
                }}
              />

              {/* Decorative line under main text */}
              <div
                className={`mx-auto mt-3 sm:mt-4 md:mt-6 h-0.5 sm:h-1 w-16 sm:w-20 md:w-24 bg-gradient-to-r ${themeConfig.bgGradient} rounded-full`}
              />
            </div>

            {/* Subtitle with delayed animation */}
            {showSubtitle && (
              <div
                className={`
                transform transition-all duration-1000 delay-700
                ${
                  animationPhase === "enter"
                    ? "translate-y-4 sm:translate-y-8 opacity-0"
                    : "translate-y-0 opacity-100"
                }
              `}
              >
                <p
                  className={`
                  text-sm sm:text-base md:text-lg lg:text-xl ${themeConfig.accentColor} 
                  font-medium italic leading-relaxed
                  max-w-xs sm:max-w-sm md:max-w-lg mx-auto
                  px-2 sm:px-0
                `}
                >
                  {variantConfig.subtitle}
                </p>
              </div>
            )}

            {/* Additional decorative text */}
            {variant === "brand" && (
              <div
                className={`
                mt-4 sm:mt-6 transform transition-all duration-1000 delay-1000
                ${
                  animationPhase === "enter"
                    ? "translate-y-4 sm:translate-y-8 opacity-0"
                    : "translate-y-0 opacity-100"
                }
              `}
              >
                <div className="flex flex-col xs:flex-row items-center justify-center space-y-1 xs:space-y-0 xs:space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-500">
                  <span>EST. 2020</span>
                  <span className="hidden xs:inline">•</span>
                  <span className="text-center xs:text-left">
                    HANDCRAFTED EXCELLENCE
                  </span>
                  <span className="hidden xs:inline">•</span>
                  <span>PREMIUM QUALITY</span>
                </div>
              </div>
            )}

            {/* Loading dots for loading variant */}
            {variant === "loading" && (
              <div className="flex justify-center mt-4 sm:mt-6 md:mt-8 space-x-1 sm:space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 sm:w-3 sm:h-3 ${themeConfig.accentColor.replace(
                      "text-",
                      "bg-"
                    )} rounded-full animate-bounce`}
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Bottom decorative border - Thinner on mobile */}
          {/* <div
            className={`h-1 sm:h-2 bg-gradient-to-r ${themeConfig.bgGradient} rounded-b-2xl sm:rounded-b-3xl`}
          /> */}
        </div>
      </div>
    </>
  );
};

export default VaniSareesAnimationDialog;
