import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export function ProductFeaturesAccordion({ features }) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 640 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Always open on desktop/tablet
  useEffect(() => {
    if (!isMobile) setOpen(true);
  }, [isMobile]);

  if (!(features && features.length > 0)) return null;

  const handleToggle = () => {
    if (isMobile) setOpen((prev) => !prev);
  };

  return (
    <section className="mb-6 rounded-lg border border-gray-200 bg-white shadow-sm">
      <button
        className={`flex items-center justify-between w-full px-4 py-3 focus:outline-none transition-colors ${
          open
            ? "bg-blue-50 text-blue-800"
            : "bg-gray-50 text-gray-900 hover:bg-blue-50 hover:text-blue-800"
        } rounded-t-lg`}
        onClick={handleToggle}
        type="button"
        aria-expanded={open}
      >
        <span className="font-semibold">Features</span>
        {/* Chevron with animation; visible on mobile only */}
        {isMobile && (
          <span
            className={`ml-2 transition-transform duration-300 ${
              open ? "rotate-180" : "rotate-0"
            }`}
          >
            <ChevronDown className="w-5 h-5" />
          </span>
        )}
      </button>

      <div
        style={{
          maxHeight: open ? "450px" : "0px",
          overflow: "hidden",
          transition: "max-height 0.4s cubic-bezier(0.4,0,0.2,1)",
        }}
        className={`px-4 pb-3 transition-opacity duration-300 ease-in-out ${
          open ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden={!open}
      >
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          {features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
