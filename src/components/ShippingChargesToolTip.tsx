import { useState } from "react";

const ShippingInfoTooltip = () => {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="relative inline-block">
      {/* ❓ Info icon */}
      <div
        className="w-5 h-5 flex items-center justify-center bg-gray-300 text-black rounded-full text-xs font-bold cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        ?
      </div>

      {/* 📝 Tooltip Card */}
      {hovered && (
        <div className="absolute z-50 top-7 left-0 w-64 p-3 bg-white shadow-lg rounded-xl border text-sm space-y-2">
          <ul className="list-disc pl-5 text-gray-700">
            <li>Enjoy free delivery on orders of ₹999 or above.</li>
            <li>A delivery fee of ₹50 applies to orders below ₹999.</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ShippingInfoTooltip;
