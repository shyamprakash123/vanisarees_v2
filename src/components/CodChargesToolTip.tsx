import { useState } from "react";

const CodInfoTooltip = () => {
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
            <li>
              COD charges apply to all Cash on Delivery orders as per our
              courier partner’s policy.
            </li>
            <li>COD fee: ₹50 or 2.5% of the subtotal — whichever is higher.</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default CodInfoTooltip;
