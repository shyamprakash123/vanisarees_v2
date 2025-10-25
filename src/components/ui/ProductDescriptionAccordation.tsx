import { useState } from "react";

export function ProductDescriptionAccordion({ description }) {
  const [open, setOpen] = useState(false);

  const isMobile = typeof window !== "undefined" && window.innerWidth <= 640;

  // Only allow toggle on mobile
  const handleToggle = () => {
    if (isMobile) setOpen((prev) => !prev);
  };

  return (
    <div className="md:block">
      {/* On mobile, accordion; on desktop, always open */}
      <div
        className={`accordion-mobile ${open ? "open" : ""} md:open`}
        onClick={handleToggle}
        style={{
          cursor: isMobile ? "pointer" : "default",
          overflow: "hidden",
          transition: "max-height 0.3s cubic-bezier(0.4,0.0,0.2,1)",
          maxHeight: isMobile
            ? open
              ? "1200px" // Large enough for longest text
              : "0px"
            : "none",
        }}
      >
        <p className="text-gray-600 mb-6">{description}</p>
      </div>

      {/* Toggle button: visible only on mobile */}
      {isMobile && (
        <button
          onClick={handleToggle}
          className="mt-2 text-sm text-blue-600 underline md:hidden"
        >
          {open ? "Hide" : "Show"} Description
        </button>
      )}
    </div>
  );
}
