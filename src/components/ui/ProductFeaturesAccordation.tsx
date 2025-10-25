import { useState } from "react";

export function ProductFeaturesAccordion({ features }) {
  const [open, setOpen] = useState(false);

  const isMobile = typeof window !== "undefined" && window.innerWidth <= 640;

  const handleToggle = () => {
    if (isMobile) setOpen((prev) => !prev);
  };

  if (!(features && features.length > 0)) return null;

  return (
    <div className="mb-6">
      <div
        className="flex items-center justify-between cursor-pointer md:cursor-default"
        onClick={handleToggle}
      >
        <h3 className="font-semibold text-gray-900 mb-2">Features:</h3>
        {/* Toggle button, mobile only */}
        {isMobile && (
          <button
            className="text-blue-600 text-sm underline ml-2 md:hidden"
            type="button"
            onClick={handleToggle}
          >
            {open ? "Hide" : "Show"}
          </button>
        )}
      </div>
      <div
        className={`accordion-mobile ${open ? "open" : ""} md:open`}
        style={{
          overflow: "hidden",
          transition: "max-height 0.3s cubic-bezier(0.4,0.0,0.2,1)",
          maxHeight: isMobile ? (open ? "800px" : "0px") : "none",
        }}
      >
        <ul className="list-disc list-inside space-y-1 text-gray-600 mb-2">
          {features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
